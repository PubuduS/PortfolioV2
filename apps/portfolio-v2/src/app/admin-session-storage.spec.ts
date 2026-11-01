import {
  Action,
  ActionReducer,
} from '@ngrx/store';

import { StoreState } from '@portfolio-v2/state';
import {
  adminSessionMetaReducers,
  omitAdminPrivileges,
} from './admin-session-storage';

interface PersistedAppState {
  stateBanks: StoreState;
}

function applyMeta(
  reducer: ActionReducer<PersistedAppState, Action>,
): ActionReducer<PersistedAppState, Action> {
  return adminSessionMetaReducers().reduceRight(
    (composed, meta) => meta(composed),
    reducer,
  );
}

describe('admin session storage', () => {
  const initial: PersistedAppState = {
    stateBanks: {
      isAdmin: false,
      isPreviewMode: false,
      isPartyMode: false,
      selectedProjectCardID: 0,
      selectedPublicationID: 0,
    },
  };

  beforeEach(() => {
    localStorage.clear();
  });

  describe('omitAdminPrivileges', () => {
    it('should keep cached content and clear privilege flags', () => {
      expect(omitAdminPrivileges({
        isAdmin: true,
        isPreviewMode: true,
        isPartyMode: true,
        selectedProjectCardID: 4,
      })).toEqual({
        isAdmin: false,
        isPreviewMode: false,
        isPartyMode: true,
        selectedProjectCardID: 4,
      });
    });
  });

  describe('when local storage has an admin flag from another visit', () => {
    it('should restore the cache without admin privilege', () => {
      localStorage.setItem('stateBanks', JSON.stringify({
        isAdmin: true,
        isPreviewMode: true,
        isPartyMode: true,
        selectedProjectCardID: 4,
      }));
      const reducer = applyMeta((state = initial) => state);

      const next = reducer(undefined, { type: '@ngrx/store/init' });

      expect(next.stateBanks.isAdmin).toBe(false);
      expect(next.stateBanks.isPreviewMode).toBe(false);
      expect(next.stateBanks.isPartyMode).toBe(true);
      expect(next.stateBanks.selectedProjectCardID).toBe(4);
    });

    it('should write later admin changes back without the privilege flag', () => {
      const reducer = applyMeta((state = initial) => state);
      const started = reducer(undefined, { type: '@ngrx/store/init' });
      const signedIn: PersistedAppState = {
        ...started,
        stateBanks: {
          ...started.stateBanks,
          isAdmin: true,
          isPreviewMode: true,
        },
      };

      const next = reducer(signedIn, { type: '[State] Admin State Updated' });
      const stored = JSON.parse(localStorage.getItem('stateBanks') ?? '{}') as StoreState;

      expect(next.stateBanks.isAdmin).toBe(true);
      expect(stored.isAdmin).toBe(false);
      expect(stored.isPreviewMode).toBe(false);
    });
  });
});
