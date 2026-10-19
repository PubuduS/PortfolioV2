import {
  ApplicationConfig,
  EnvironmentProviders,
  Provider,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import {
  initializeApp,
  provideFirebaseApp,
} from '@angular/fire/app';
import {
  getAnalytics,
  provideAnalytics,
  ScreenTrackingService,
  UserTrackingService,
} from '@angular/fire/analytics';
import {
  connectAuthEmulator,
  getAuth,
  provideAuth,
} from '@angular/fire/auth';
import {
  connectFirestoreEmulator,
  getFirestore,
  provideFirestore,
} from '@angular/fire/firestore';
import {
  connectStorageEmulator,
  getStorage,
  provideStorage,
} from '@angular/fire/storage';
import {
  getDatabase,
  provideDatabase,
} from '@angular/fire/database';
import {
  getPerformance,
  providePerformance,
} from '@angular/fire/performance';
import {
  ActionReducer,
  MetaReducer,
  provideStore,
} from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { provideStoreDevtools } from '@ngrx/store-devtools';
import { localStorageSync } from 'ngrx-store-localstorage';

import {
  AppState,
  stateReducers,
  StateEffects,
} from '@portfolio-v2/state';
import { environment } from '../environments/environment';
import { AppEnvironment } from '../environments/environment.model';
import { appRoutes } from './app.routes';

const { emulators }: AppEnvironment = environment;

/** Providers that only make sense against the live project. */
const liveOnlyProviders: Array<Provider | EnvironmentProviders> = emulators
  ? []
  : [
    provideAnalytics(() => getAnalytics()),
    provideDatabase(() => getDatabase()),
    providePerformance(() => getPerformance()),
    ScreenTrackingService,
    UserTrackingService,
  ];

/**
 * Sync the state with local storage to rehydrate
 * @param reducer reducer
 * @returns Action Reducer
 */
export function localStorageSyncReducer(reducer: ActionReducer<AppState>)
  : ActionReducer<AppState> {
  return localStorageSync({ keys: ['stateBanks'], rehydrate: true })(reducer);
}

/**
 * Meta Reducer
 * This is used as a rehydration.
 * This will basically cash immediate previous visits.
 * When the user reclick an immediate previous visit,
 * instead of contacting database, this will pull the
 * data from local cache from the browswer.
 */
const metaReducer: Array<MetaReducer<any, any>> = [localStorageSyncReducer];

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(),
    provideRouter(appRoutes),
    provideAnimations(),
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideAuth(() => {
      const auth = getAuth();
      if (emulators) {
        connectAuthEmulator(auth, `http://${emulators.auth.host}:${emulators.auth.port}`, { disableWarnings: true });
      }
      return auth;
    }),
    provideStorage(() => {
      const storage = getStorage();
      if (emulators) {
        connectStorageEmulator(storage, emulators.storage.host, emulators.storage.port);
      }
      return storage;
    }),
    provideFirestore(() => {
      const firestore = getFirestore();
      if (emulators) {
        connectFirestoreEmulator(firestore, emulators.firestore.host, emulators.firestore.port);
      }
      return firestore;
    }),
    ...liveOnlyProviders,
    provideStore({ stateBanks: stateReducers }, { metaReducers: metaReducer }),
    provideStoreDevtools({
      maxAge: 25,
      logOnly: true,
      connectInZone: true,
    }),
    provideEffects([StateEffects]),
  ],
};
