import { createHash } from 'node:crypto';

import {
  CONTACT_EMAIL_MAX,
  CONTACT_MAX_LINKS,
  CONTACT_MESSAGE_MAX,
  CONTACT_MESSAGE_MIN,
  CONTACT_NAME_MAX,
  CONTACT_NAME_MIN,
  CONTACT_NAME_PATTERN,
} from '@portfolio-v2/contracts/contact-limits';

/** Inbox that receives every contact-form message. Callers cannot choose another recipient. */
export const OWNER_EMAIL = 'pubudusupun@gmail.com';

/** Subject prefix so these messages are recognizable in the inbox. */
export const SUBJECT_PREFIX = '[Portfolio site]';

/** How many messages one email address may send during an hour. */
export const PER_EMAIL_PER_HOUR = 3;

/** How many messages one network address may send during an hour. */
export const PER_IP_PER_HOUR = 5;

/** How many messages the whole site may send during an hour. */
export const GLOBAL_PER_HOUR = 15;

/** How many messages the whole site may send during a day. */
export const GLOBAL_PER_DAY = 40;

/** Hourly counter window. */
export const HOUR_MS = 60 * 60 * 1000;

/** Daily counter window. */
export const DAY_MS = 24 * HOUR_MS;

/** One line, no header-breaking characters. */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Counts http and https links. */
const LINK_PATTERN = /https?:\/\//gi;

/** Why a contact message was refused. */
export type ContactFailure = 'invalid' | 'limited' | 'unavailable' | 'failed';

/** A message that passed validation. */
export interface AcceptedContact {
  email: string;
  name: string;
  message: string;
}

/** Sliding-window counter stored for one limit. */
export interface UsageBucket {
  windowStartMs: number;
  count: number;
}

/** Counters after a quota check. Denied checks leave the stored counts unchanged. */
export interface ReservedQuota {
  allowed: boolean;
  email: UsageBucket;
  ip?: UsageBucket;
  hourly: UsageBucket;
  daily: UsageBucket;
}

/** Mail headers and body. The recipient is always the site owner. */
export interface AddressedMail {
  from: string;
  to: string;
  replyTo: string;
  subject: string;
  text: string;
}

/** Result of reading the callable payload. */
export type ParsedContact = {
  kind: 'ok';
  contact: AcceptedContact;
} | {
  kind: 'honeypot';
} | {
  kind: 'invalid';
};

/** Side effects the callable supplies. */
export interface ContactDependencies {
  dryRun: boolean;
  reserve: (contact: AcceptedContact, callerIp: string | undefined) => Promise<boolean>;
  send: (mail: AddressedMail) => Promise<void>;
}

/**
 * Refusal raised by the contact handler before it becomes an HTTP error.
 */
export class ContactRejected extends Error {
  /**
   * @param code Machine-readable reason.
   */
  constructor(public readonly code: ContactFailure) {
    super(code);
    this.name = 'ContactRejected';
  }
}

/**
 * Builds a stable document id that does not contain the raw email or address.
 * @param kind Which bucket the value belongs to.
 * @param value Email address or caller address.
 * @returns Firestore document id.
 */
export function guardDocumentId(kind: 'email' | 'ip', value: string): string {
  const digest = createHash('sha256')
    .update(`portfolio-contact:${kind}:${value}`)
    .digest('hex');
  return `${kind}_${digest}`;
}

/**
 * Reads the caller address from proxy headers.
 * @param forwardedFor X-Forwarded-For header.
 * @param socketAddress Address on the socket, when the header is missing.
 * @returns A bounded address, or undefined when none is available.
 */
export function callerAddress(
  forwardedFor: string | string[] | undefined,
  socketAddress: string | undefined,
): string | undefined {
  const header = Array.isArray(forwardedFor)
    ? forwardedFor.join(',')
    : forwardedFor;
  const forwarded = header
    ?.split(',')
    .map((part) => part.trim())
    .find((part) => part.length > 0);
  const address = (forwarded || socketAddress || '').trim();
  if (address.length === 0 || address.toLowerCase() === 'unknown') {
    return undefined;
  }
  return address.slice(0, 200);
}

/**
 * Reads a stored counter, ignoring corrupt documents.
 * @param value Firestore document data.
 * @returns The counter, or undefined when the document is missing or unusable.
 */
export function readBucket(value: unknown): UsageBucket | undefined {
  if (typeof value !== 'object' || value === null) {
    return undefined;
  }
  const windowStartMs = 'windowStartMs' in value
    ? value.windowStartMs
    : undefined;
  const count = 'count' in value
    ? value.count
    : undefined;
  if (typeof windowStartMs !== 'number' || typeof count !== 'number') {
    return undefined;
  }
  if (!Number.isFinite(windowStartMs) || !Number.isFinite(count) || count < 0) {
    return undefined;
  }
  return {
    windowStartMs,
    count,
  };
}

function advance(
  bucket: UsageBucket | undefined,
  nowMs: number,
  windowMs: number,
  limit: number,
): { bucket: UsageBucket; allowed: boolean } {
  const expired = bucket === undefined || nowMs - bucket.windowStartMs >= windowMs;
  const windowStartMs = expired
    ? nowMs
    : bucket.windowStartMs;
  const count = expired
    ? 0
    : bucket.count;
  if (count >= limit) {
    return {
      bucket: {
        windowStartMs,
        count,
      },
      allowed: false,
    };
  }
  return {
    bucket: {
      windowStartMs,
      count: count + 1,
    },
    allowed: true,
  };
}

function emptyBucket(nowMs: number): UsageBucket {
  return {
    windowStartMs: nowMs,
    count: 0,
  };
}

function isHoneypot(value: unknown): boolean {
  if (value === undefined || value === '') {
    return false;
  }
  if (typeof value !== 'string') {
    return true;
  }
  return value.trim().length > 0;
}

function isSafeEmail(value: string): boolean {
  return value.length > 0
    && value.length <= CONTACT_EMAIL_MAX
    && !/[\r\n<>]/.test(value)
    && EMAIL_PATTERN.test(value);
}

function isSafeName(value: string): boolean {
  return value.length >= CONTACT_NAME_MIN
    && value.length <= CONTACT_NAME_MAX
    && CONTACT_NAME_PATTERN.test(value);
}

function isSafeMessage(value: string): boolean {
  if (
    value.length < CONTACT_MESSAGE_MIN
    || value.length > CONTACT_MESSAGE_MAX
    || value.includes('\0')
  ) {
    return false;
  }
  const links = value.match(LINK_PATTERN);
  return links === null || links.length <= CONTACT_MAX_LINKS;
}

function headerValue(value: string): string {
  return value.replace(/[\r\n]/g, '');
}

/**
 * Accepts the message when every limit still has room, and increments those counters.
 * @param input Current counters and whether an address bucket applies.
 * @param input.nowMs Current timestamp.
 * @param input.email Email counter.
 * @param input.ip IP counter.
 * @param input.hourly Hourly counter.
 * @param input.daily Daily counter.
 * @param input.trackIp Whether to track IP addresses.
 * @returns The next counters. A denial does not increment anything.
 */
export function consumeQuota(input: {
  nowMs: number;
  email?: UsageBucket;
  ip?: UsageBucket;
  hourly?: UsageBucket;
  daily?: UsageBucket;
  trackIp: boolean;
}): ReservedQuota {
  const email = advance(input.email, input.nowMs, HOUR_MS, PER_EMAIL_PER_HOUR);
  const ip = input.trackIp
    ? advance(input.ip, input.nowMs, HOUR_MS, PER_IP_PER_HOUR)
    : undefined;
  const hourly = advance(input.hourly, input.nowMs, HOUR_MS, GLOBAL_PER_HOUR);
  const daily = advance(input.daily, input.nowMs, DAY_MS, GLOBAL_PER_DAY);
  const allowed = email.allowed
    && hourly.allowed
    && daily.allowed
    && (ip?.allowed ?? true);
  if (!allowed) {
    return {
      allowed: false,
      email: input.email ?? emptyBucket(input.nowMs),
      ip: input.trackIp
        ? (input.ip ?? emptyBucket(input.nowMs))
        : undefined,
      hourly: input.hourly ?? emptyBucket(input.nowMs),
      daily: input.daily ?? emptyBucket(input.nowMs),
    };
  }
  return {
    allowed: true,
    email: email.bucket,
    ip: ip?.bucket,
    hourly: hourly.bucket,
    daily: daily.bucket,
  };
}

/**
 * Validates the callable payload.
 * A filled fax field is treated as a bot and is not an error.
 * @param data Untrusted request body.
 * @returns A parsed message, a honeypot hit, or an invalid payload.
 */
export function parseContact(data: unknown): ParsedContact {
  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    return { kind: 'invalid' };
  }
  const record = data as Record<string, unknown>;
  if (isHoneypot(record['faxNumber'])) {
    return { kind: 'honeypot' };
  }
  const email = typeof record['email'] === 'string'
    ? record['email'].trim().toLowerCase()
    : '';
  const name = typeof record['name'] === 'string'
    ? record['name'].trim()
    : '';
  const message = typeof record['message'] === 'string'
    ? record['message'].trim()
    : '';
  if (!isSafeEmail(email) || !isSafeName(name) || !isSafeMessage(message)) {
    return { kind: 'invalid' };
  }
  return {
    kind: 'ok',
    contact: {
      email,
      name,
      message,
    },
  };
}

/**
 * Builds the message that is sent to the site owner.
 * @param contact Validated visitor details.
 * @returns Headers and plain-text body. `to` is always the owner.
 */
export function addressedMail(contact: AcceptedContact): AddressedMail {
  const email = headerValue(contact.email);
  const name = headerValue(contact.name);
  return {
    from: `Portfolio site <${OWNER_EMAIL}>`,
    to: OWNER_EMAIL,
    replyTo: email,
    subject: `${SUBJECT_PREFIX} Message from ${name}`,
    text: [
      'A visitor sent this message from the portfolio site.',
      '',
      `Name: ${name}`,
      `Email: ${email}`,
      '',
      contact.message,
    ].join('\n'),
  };
}

/**
 * Reserves a send slot, then emails the owner.
 * @param data Untrusted request body.
 * @param callerIp Caller address, when one is known.
 * @param deps Quota store and mail transport.
 * @returns Acceptance. A honeypot or a local dry run does not send mail.
 */
export async function acceptContactMessage(
  data: unknown,
  callerIp: string | undefined,
  deps: ContactDependencies,
): Promise<{ accepted: true; dryRun: boolean }> {
  const parsed = parseContact(data);
  if (parsed.kind === 'honeypot') {
    return {
      accepted: true,
      dryRun: false,
    };
  }
  if (parsed.kind === 'invalid') {
    throw new ContactRejected('invalid');
  }
  let reserved = false;
  try {
    reserved = await deps.reserve(parsed.contact, callerIp);
  } catch {
    throw new ContactRejected('unavailable');
  }
  if (!reserved) {
    throw new ContactRejected('limited');
  }
  if (deps.dryRun) {
    return {
      accepted: true,
      dryRun: true,
    };
  }
  try {
    await deps.send(addressedMail(parsed.contact));
  } catch {
    throw new ContactRejected('failed');
  }
  return {
    accepted: true,
    dryRun: false,
  };
}
