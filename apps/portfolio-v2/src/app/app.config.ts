import {
  ApplicationConfig,
  EnvironmentProviders,
  provideAppInitializer,
  Provider,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import {
  getApp,
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
  browserSessionPersistence,
  connectAuthEmulator,
  initializeAuth,
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
  connectFunctionsEmulator,
  getFunctions,
  provideFunctions,
} from '@angular/fire/functions';
import {
  getPerformance,
  providePerformance,
} from '@angular/fire/performance';
import { provideEffects } from '@ngrx/effects';
import { provideStore } from '@ngrx/store';
import { provideStoreDevtools } from '@ngrx/store-devtools';

import {
  AUTH_TARGET,
  authAppName,
  isolateAuthPersistence,
  resolveAuthTarget,
} from '@portfolio-v2/shared/services';
import {
  stateReducers,
  StateEffects,
} from '@portfolio-v2/state';
import { environment } from '../environments/environment';
import { AppEnvironment } from '../environments/environment.model';
import { adminSessionMetaReducers } from './admin-session-storage';
import { appRoutes } from './app.routes';

const { emulators }: AppEnvironment = environment;

/** Auth backend this build is allowed to trust. Emulator and live never share a user. */
const sessionTarget = resolveAuthTarget(Boolean(emulators));

/**
 * The Firebase app for this auth backend.
 * Its name is part of the Auth persistence key, so emulator and live users stay apart.
 * @returns The initialized Firebase app.
 */
function firebaseApp(): ReturnType<typeof getApp> {
  return getApp(authAppName(sessionTarget));
}

/** Providers that only make sense against the live project. */
const liveOnlyProviders: Array<Provider | EnvironmentProviders> = emulators
  ? []
  : [
    provideAnalytics(() => getAnalytics(firebaseApp())),
    provideDatabase(() => getDatabase(firebaseApp())),
    providePerformance(() => getPerformance(firebaseApp())),
    ScreenTrackingService,
    UserTrackingService,
  ];

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(),
    provideRouter(appRoutes),
    provideAnimations(),
    provideAppInitializer(() => isolateAuthPersistence(sessionTarget)),
    { provide: AUTH_TARGET, useValue: sessionTarget },
    provideFirebaseApp(() => initializeApp(environment.firebase, authAppName(sessionTarget))),
    provideAuth(() => {
      const auth = initializeAuth(firebaseApp(), {
        persistence: browserSessionPersistence,
      });
      if (emulators) {
        connectAuthEmulator(auth, `http://${emulators.auth.host}:${emulators.auth.port}`, { disableWarnings: true });
      }
      return auth;
    }),
    provideStorage(() => {
      const storage = getStorage(firebaseApp());
      if (emulators) {
        connectStorageEmulator(storage, emulators.storage.host, emulators.storage.port);
      }
      return storage;
    }),
    provideFirestore(() => {
      const firestore = getFirestore(firebaseApp());
      if (emulators) {
        connectFirestoreEmulator(firestore, emulators.firestore.host, emulators.firestore.port);
      }
      return firestore;
    }),
    provideFunctions(() => {
      const functions = getFunctions(firebaseApp(), 'us-central1');
      if (emulators) {
        connectFunctionsEmulator(functions, emulators.functions.host, emulators.functions.port);
      }
      return functions;
    }),
    ...liveOnlyProviders,
    provideStore({ stateBanks: stateReducers }, { metaReducers: adminSessionMetaReducers() }),
    provideStoreDevtools({
      maxAge: 25,
      logOnly: true,
      connectInZone: true,
    }),
    provideEffects([StateEffects]),
  ],
};
