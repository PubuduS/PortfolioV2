import type { Firestore } from 'firebase-admin/firestore';

import {
  PER_EMAIL_PER_HOUR,
  guardDocumentId,
} from './contact-message';
import {
  GUARD_COLLECTION,
  reserveContactQuota,
} from './quota-store';

const NOW = 1_700_000_000_000;

const contact = {
  email: 'ada@example.com',
  name: 'Ada',
  message: 'Hello from the contact form.',
};

/** In-memory stand-in for the guard collection. */
interface MemoryStore {
  db: Firestore;
  collectionNames: string[];
  written: string[];
  docs: Map<string, Record<string, unknown>>;
}

/**
 * @param initial documents already stored, keyed by id
 * @returns a store that records the documents a transaction writes
 */
function memoryStore(initial: Record<string, Record<string, unknown>> = {}): MemoryStore {
  const docs = new Map(Object.entries(initial));
  const collectionNames: string[] = [];
  const written: string[] = [];
  const db = {
    collection(name: string): { doc: (id: string) => { id: string } } {
      collectionNames.push(name);
      return {
        doc(id: string): { id: string } {
          return { id };
        },
      };
    },
    async runTransaction(
      run: (tx: {
        get: (ref: { id: string }) => Promise<{ data: () => Record<string, unknown> | undefined }>;
        set: (ref: { id: string }, data: Record<string, unknown>) => void;
      }) => Promise<boolean>,
    ): Promise<boolean> {
      return run({
        async get(ref) {
          return { data: () => docs.get(ref.id) };
        },
        set(ref, data) {
          written.push(ref.id);
          docs.set(ref.id, data);
        },
      });
    },
  };

  return {
    db: db as unknown as Firestore,
    collectionNames,
    written,
    docs,
  };
}

describe('reserveContactQuota', () => {
  describe('when the visitor has not sent a message yet', () => {
    it('should reserve a slot and write each guard document', async () => {
      const store = memoryStore();
      const caller = '203.0.113.8';

      await expect(reserveContactQuota(store.db, contact, caller, NOW)).resolves.toBe(true);

      const emailId = guardDocumentId('email', contact.email);
      const ipId = guardDocumentId('ip', caller);
      const reserved = { windowStartMs: NOW, count: 1 };

      expect(store.collectionNames).toEqual(['contact-mail-guard']);
      expect(GUARD_COLLECTION).toBe('contact-mail-guard');
      expect(store.written).toEqual(['hourly', 'daily', emailId, ipId]);
      expect(store.docs.get('hourly')).toEqual(reserved);
      expect(store.docs.get('daily')).toEqual(reserved);
      expect(store.docs.get(emailId)).toEqual(reserved);
      expect(store.docs.get(ipId)).toEqual(reserved);
    });

    it('should skip the address document when the caller address is unknown', async () => {
      const store = memoryStore();

      await expect(reserveContactQuota(store.db, contact, undefined, NOW)).resolves.toBe(true);

      expect(store.written).toEqual([
        'hourly',
        'daily',
        guardDocumentId('email', contact.email),
      ]);
    });
  });

  describe('when that email is already at its hourly limit', () => {
    it('should refuse the send and leave the stored counters unchanged', async () => {
      const emailId = guardDocumentId('email', contact.email);
      const stored = { windowStartMs: NOW, count: PER_EMAIL_PER_HOUR };
      const store = memoryStore({ [emailId]: stored });

      await expect(reserveContactQuota(store.db, contact, '203.0.113.8', NOW)).resolves.toBe(false);

      expect(store.written).toEqual([]);
      expect(store.docs.get(emailId)).toEqual(stored);
    });
  });

  describe('when the transaction fails', () => {
    it('should reject instead of treating the send as allowed', async () => {
      const db = {
        collection: (): { doc: (id: string) => { id: string } } => ({
          doc: (id: string): { id: string } => ({ id }),
        }),
        runTransaction: async (): Promise<boolean> => {
          throw new Error('unavailable');
        },
      } as unknown as Firestore;

      await expect(reserveContactQuota(db, contact, undefined, NOW)).rejects.toThrow('unavailable');
    });
  });
});
