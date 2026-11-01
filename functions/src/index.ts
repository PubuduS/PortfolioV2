import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions';
import { defineSecret } from 'firebase-functions/params';
import {
  HttpsError,
  onCall,
  type CallableRequest,
} from 'firebase-functions/v2/https';
import nodemailer from 'nodemailer';

import {
  type AddressedMail,
  type ContactFailure,
  ContactRejected,
  OWNER_EMAIL,
  acceptContactMessage,
  callerAddress,
} from './contact-message';
import { reserveContactQuota } from './quota-store';

const gmailAppPassword = defineSecret('GMAIL_APP_PASSWORD');

initializeApp();

/**
 * Sends one contact-form message to the site owner.
 * The recipient and subject prefix are fixed. Quota is reserved before any mail is sent.
 */
export const sendContactMessage = onCall(
  {
    region: 'us-central1',
    invoker: 'public',
    maxInstances: 2,
    concurrency: 20,
    timeoutSeconds: 20,
    memory: '256MiB',
    secrets: [gmailAppPassword],
  },
  async (request) => {
    const emulator = process.env['FUNCTIONS_EMULATOR'] === 'true';
    const password = emulator
      ? (process.env['GMAIL_APP_PASSWORD'] ?? '')
      : gmailAppPassword.value();
    const dryRun = emulator && password.length === 0;
    if (!dryRun && password.length === 0) {
      logger.error('GMAIL_APP_PASSWORD is not set');
      throw new HttpsError('failed-precondition', 'The message could not be sent.');
    }
    try {
      return await acceptContactMessage(request.data, requestAddress(request), {
        dryRun,
        reserve: (contact, callerIp) => reserveContactQuota(
          getFirestore(),
          contact,
          callerIp,
          Date.now(),
        ),
        send: (mail) => deliver(mail, password),
      });
    } catch (error: unknown) {
      if (error instanceof ContactRejected) {
        throw httpsErrorFor(error.code);
      }
      logger.error('contact mail failed');
      throw new HttpsError('internal', 'The message could not be sent.');
    }
  },
);

function requestAddress(request: CallableRequest<unknown>): string | undefined {
  const header = request.rawRequest?.headers?.['x-forwarded-for'];
  return callerAddress(header, request.rawRequest?.ip);
}

async function deliver(mail: AddressedMail, password: string): Promise<void> {
  const transport = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: OWNER_EMAIL,
      pass: password,
    },
  });
  await transport.sendMail({
    from: mail.from,
    to: mail.to,
    replyTo: mail.replyTo,
    subject: mail.subject,
    text: mail.text,
  });
}

function httpsErrorFor(code: ContactFailure): HttpsError {
  if (code === 'invalid') {
    return new HttpsError('invalid-argument', 'Check the name, email, and message.');
  }
  if (code === 'limited') {
    return new HttpsError('resource-exhausted', 'Too many messages. Try again later.');
  }
  if (code === 'unavailable') {
    return new HttpsError('unavailable', 'The message could not be sent. Try again later.');
  }
  return new HttpsError('internal', 'The message could not be sent.');
}
