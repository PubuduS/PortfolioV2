import { type Firestore } from 'firebase-admin/firestore';

import {
  type AcceptedContact,
  consumeQuota,
  guardDocumentId,
  readBucket,
} from './contact-message';

/** Collection written only by the Admin SDK. Client rules deny every read and write. */
export const GUARD_COLLECTION = 'contact-mail-guard';

/**
 * Reserves one send against the email, address, hourly, and daily limits.
 * Fails closed: a store error rejects the send instead of emailing anyway.
 * @param db Firestore handle. The emulator or production project is chosen by the caller.
 * @param contact Validated visitor details.
 * @param callerIp Caller address, when one is known.
 * @param nowMs Current time in milliseconds.
 * @returns True when a slot was reserved.
 */
export async function reserveContactQuota(
  db: Firestore,
  contact: AcceptedContact,
  callerIp: string | undefined,
  nowMs: number,
): Promise<boolean> {
  const collection = db.collection(GUARD_COLLECTION);
  const hourlyRef = collection.doc('hourly');
  const dailyRef = collection.doc('daily');
  const emailRef = collection.doc(guardDocumentId('email', contact.email));
  const ipRef = callerIp
    ? collection.doc(guardDocumentId('ip', callerIp))
    : undefined;
  return db.runTransaction(async (tx) => {
    const hourlySnap = await tx.get(hourlyRef);
    const dailySnap = await tx.get(dailyRef);
    const emailSnap = await tx.get(emailRef);
    const ipSnap = ipRef
      ? await tx.get(ipRef)
      : undefined;
    const decision = consumeQuota({
      nowMs,
      hourly: readBucket(hourlySnap.data()),
      daily: readBucket(dailySnap.data()),
      email: readBucket(emailSnap.data()),
      ip: ipSnap
        ? readBucket(ipSnap.data())
        : undefined,
      trackIp: ipRef !== undefined,
    });
    if (!decision.allowed) {
      return false;
    }
    tx.set(hourlyRef, decision.hourly);
    tx.set(dailyRef, decision.daily);
    tx.set(emailRef, decision.email);
    if (ipRef && decision.ip) {
      tx.set(ipRef, decision.ip);
    }
    return true;
  });
}
