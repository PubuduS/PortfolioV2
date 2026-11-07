import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions';
import {
  defineSecret,
  defineString,
} from 'firebase-functions/params';
import {
  HttpsError,
  onCall,
  type CallableRequest,
} from 'firebase-functions/v2/https';
import { BetaAnalyticsDataClient, type protos } from '@google-analytics/data';
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
import {
  analyticsPropertyId,
  cachedAnalytics,
  collectSiteAnalytics,
  isAnalyticsAdmin,
  type AnalyticsCache,
  type AnalyticsDataClient,
  type SiteAnalyticsReport,
} from './site-analytics';

const gmailAppPassword = defineSecret('GMAIL_APP_PASSWORD');

/** Numeric GA4 property. Empty until the dashboard is connected. */
const ga4PropertyId = defineString('GA4_PROPERTY_ID', {
  default: '',
  description: 'Numeric GA4 property id for the admin analytics dashboard.',
});

/** How long a dashboard report can be reused. */
const ANALYTICS_CACHE_MS = 5 * 60 * 1000;

initializeApp();

let analyticsCache: AnalyticsCache | null = null;

let analyticsClient: AnalyticsDataClient | null = null;

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

type BatchRequest = protos.google.analytics.data.v1beta.IBatchRunReportsRequest;

type RealtimeRequest = protos.google.analytics.data.v1beta.IRunRealtimeReportRequest;

/**
 * Returns the admin analytics dashboard.
 * Callers must be signed in with the admin password provider.
 */
export const getSiteAnalytics = onCall(
  {
    region: 'us-central1',
    invoker: 'public',
    maxInstances: 2,
    concurrency: 20,
    timeoutSeconds: 60,
    memory: '256MiB',
  },
  async (request): Promise<SiteAnalyticsReport> => {
    if (!isAnalyticsAdmin(request.auth)) {
      throw new HttpsError('permission-denied', 'Sign in to the admin area to view analytics.');
    }
    const propertyId = readPropertyId();
    if (propertyId === null) {
      throw new HttpsError(
        'failed-precondition',
        'Set GA4_PROPERTY_ID to the numeric Analytics property id, then grant this function Viewer access.',
      );
    }
    const now = Date.now();
    const stored = cachedAnalytics(analyticsCache, propertyId, now, ANALYTICS_CACHE_MS);
    if (stored !== null) {
      return stored;
    }
    try {
      const report = await collectSiteAnalytics(dataClient(), propertyId, new Date(now));
      analyticsCache = { propertyId, at: now, report };
      return report;
    } catch (error: unknown) {
      throw analyticsHttpsError(error);
    }
  },
);

/**
 * Reads the configured property id.
 * @returns The numeric id, or null when it is unset.
 */
function readPropertyId(): string | null {
  try {
    return analyticsPropertyId(ga4PropertyId.value());
  } catch {
    return null;
  }
}

/**
 * Data API client wrapped to the collector's interface.
 * @returns The shared client.
 */
function dataClient(): AnalyticsDataClient {
  if (analyticsClient !== null) {
    return analyticsClient;
  }
  const google = new BetaAnalyticsDataClient();
  const client: AnalyticsDataClient = {
    batchRunReports: async (request) => {
      const [response] = await google.batchRunReports(request as BatchRequest);
      return [{ reports: response.reports ?? [] }];
    },
    runRealtimeReport: async (request) => {
      const [response] = await google.runRealtimeReport(request as RealtimeRequest);
      return [response];
    },
  };
  analyticsClient = client;
  return client;
}

/**
 * Maps a Data API failure to a callable error.
 * @param error Failure from the collector or the API.
 * @returns The error the dashboard shows.
 */
function analyticsHttpsError(error: unknown): HttpsError {
  if (error instanceof HttpsError) {
    return error;
  }
  const code = errorCode(error);
  logger.error('analytics report failed', { code });
  if (code === 7) {
    return new HttpsError(
      'failed-precondition',
      'The functions service account needs Viewer access on the Analytics property.',
    );
  }
  return new HttpsError('internal', 'Analytics could not be loaded.');
}

/**
 * Reads a status code from an unknown API error.
 * @param error Caught failure.
 * @returns The numeric code, or null.
 */
function errorCode(error: unknown): number | null {
  if (typeof error !== 'object' || error === null || !('code' in error)) {
    return null;
  }
  const { code } = error;
  const parsed = typeof code === 'number' || typeof code === 'string' ? Number(code) : Number.NaN;
  return Number.isFinite(parsed) ? parsed : null;
}
