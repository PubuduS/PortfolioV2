import { compareBaseline, type ObservedState } from './compare';
import { type BaselineManifest } from './typed-json';

const manifest: BaselineManifest = {
  sourceProjectId: 'portfolio-c9b8e',
  capturedAt: '2026-01-01T00:00:00.000Z',
  sanitizerVersion: 1,
  firestore: {
    'skills-section': { docCount: 1, sha256: 'abc' },
  },
  storage: {
    'portfolio/icon.webp': { sha256: 'def', bytes: 12, contentType: 'image/webp' },
  },
};

describe('baseline comparison', () => {
  it('should accept an exact match', () => {
    expect(compareBaseline(manifest, observedFrom(manifest))).toEqual([]);
  });

  describe('when emulator data differs', () => {
    it('should report a missing collection, an extra collection, and a changed hash', () => {
      const observed = observedFrom(manifest);
      const changed: ObservedState = {
        hasAdminUser: true,
        firestore: {
          'notes-section': { docCount: 1, sha256: 'zzz' },
        },
        storage: observed.storage,
      };
      expect(compareBaseline(manifest, changed)).toEqual([
        'missing firestore collection skills-section',
        'extra firestore collection notes-section',
      ]);
    });

    it('should report a changed document hash', () => {
      const observed = observedFrom(manifest);
      const changed: ObservedState = {
        ...observed,
        firestore: {
          'skills-section': { docCount: 1, sha256: 'changed' },
        },
      };
      expect(compareBaseline(manifest, changed)).toContain('firestore collection skills-section hash mismatch');
    });

    it('should report a missing storage object', () => {
      const observed = observedFrom(manifest);
      const changed: ObservedState = {
        ...observed,
        storage: {},
      };
      expect(compareBaseline(manifest, changed)).toContain('missing storage object portfolio/icon.webp');
    });

    it('should report an extra storage object', () => {
      const observed = observedFrom(manifest);
      const changed: ObservedState = {
        ...observed,
        storage: {
          ...observed.storage,
          'portfolio/extra.webp': { sha256: 'eee', bytes: 4, contentType: 'image/webp' },
        },
      };
      expect(compareBaseline(manifest, changed)).toContain('extra storage object portfolio/extra.webp');
    });
  });

  describe('when the admin user is missing', () => {
    it('should report the missing user', () => {
      const observed = observedFrom(manifest, false);
      expect(compareBaseline(manifest, observed)).toEqual(['missing admin user']);
    });
  });
});

function observedFrom(source: BaselineManifest, hasAdminUser = true): ObservedState {
  return {
    firestore: source.firestore,
    storage: source.storage,
    hasAdminUser,
  };
}
