import {
  Action,
  ActionReducer,
  MetaReducer,
} from '@ngrx/store';
import { localStorageSync } from 'ngrx-store-localstorage';

import { StoreState } from '@portfolio-v2/state';

/** Root store shape persisted by the browser. */
interface PersistedAppState {
  stateBanks: StoreState;
}

const REHYDRATE_ACTION = '@ngrx/store/init';

/**
 * Removes admin privilege from a cached state slice.
 * @param state Cached or in-memory state slice.
 * @returns The same slice with admin and preview flags cleared.
 */
export function omitAdminPrivileges<T extends { isAdmin?: boolean; isPreviewMode?: boolean }>(
  state: T,
): T {
  return {
    ...state,
    isAdmin: false,
    isPreviewMode: false,
  };
}

/**
 * Drops admin privilege after storage rehydration so a previous visit cannot grant it.
 * @param reducer Next reducer.
 * @returns Reducer that clears admin privilege on startup.
 */
export function dropRehydratedAdminSession(
  reducer: ActionReducer<PersistedAppState, Action>,
): ActionReducer<PersistedAppState, Action> {
  return (state, action) => {
    const next = reducer(state, action);
    if (action.type !== REHYDRATE_ACTION || !next?.stateBanks) {
      return next;
    }
    return {
      ...next,
      stateBanks: omitAdminPrivileges(next.stateBanks),
    };
  };
}

/**
 * Syncs cached page data and never writes admin privilege to localStorage.
 * @param reducer Next reducer.
 * @returns Local storage meta-reducer.
 */
export function localStorageSyncReducer(
  reducer: ActionReducer<PersistedAppState, Action>,
): ActionReducer<PersistedAppState, Action> {
  return localStorageSync({
    keys: [{
      stateBanks: {
        serialize: omitAdminPrivileges,
        deserialize: omitAdminPrivileges,
      },
    }],
    rehydrate: true,
  })(reducer);
}

/**
 * Meta-reducers that keep cached content and refuse cached admin sessions.
 * The first reducer runs outside the storage sync, so a stored admin flag cannot survive startup.
 * @returns Meta-reducers for the root store.
 */
export function adminSessionMetaReducers(): MetaReducer<PersistedAppState, Action>[] {
  return [dropRehydratedAdminSession, localStorageSyncReducer];
}
