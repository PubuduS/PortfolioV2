import { type ApplicationConfig } from '@angular/core';
import { getAnalytics } from '@angular/fire/analytics'
import {
  getApp,
  initializeApp,
} from '@angular/fire/app';
import {
  connectAuthEmulator,
  initializeAuth,
} from '@angular/fire/auth';
import { getDatabase } from '@angular/fire/database'
import {
  connectFirestoreEmulator,
  getFirestore,
} from '@angular/fire/firestore';
import {
  connectFunctionsEmulator,
  getFunctions,
} from '@angular/fire/functions';
import { getPerformance } from '@angular/fire/performance'
import {
  connectStorageEmulator,
  getStorage,
} from '@angular/fire/storage';

import { type AppEnvironment } from '../environments/environment.model';

/** Factories captured from the Firebase providers while a config loads. */
const mockFactories: Array<() => unknown> = [];

/** Environment the next load of `app.config` should see. */
const mockEnvironment: { current: AppEnvironment } = {
  current: {
    firebase: {
      apiKey: 'live-key',
      authDomain: 'portfolio-c9b8e.firebaseapp.com',
      projectId: 'portfolio-c9b8e',
      storageBucket: 'portfolio-c9b8e.firebasestorage.app',
      messagingSenderId: '852441133178',
      appId: '1:852441133178:web:cd8ba0a41964001807cbc3',
    },
    openWeatherAPIKey: 'live-weather-key',
    production: true,
    development: false,
  },
};

/** Build that talks to the local emulator suite. */
const emulatorEnvironment: AppEnvironment = {
  firebase: {
    apiKey: 'fake-api-key',
    authDomain: 'demo-portfolio-v2.firebaseapp.com',
    projectId: 'demo-portfolio-v2',
    storageBucket: 'demo-portfolio-v2.appspot.com',
    messagingSenderId: '000000000000',
    appId: '1:000000000000:web:0000000000000000000000',
  },
  openWeatherAPIKey: 'fake-open-weather-key',
  production: false,
  development: true,
  emulators: {
    firestore: { host: '127.0.0.1', port: 8080 },
    auth: { host: '127.0.0.1', port: 9099 },
    storage: { host: '127.0.0.1', port: 9199 },
    functions: { host: '127.0.0.1', port: 5001 },
  },
};

jest.mock('../environments/environment', () => ({
  get environment() {
    return mockEnvironment.current;
  },
}));

jest.mock('@angular/fire/app', () => {
  const actual = jest.requireActual('@angular/fire/app');
  return {
    ...actual,
    getApp: jest.fn(() => ({ name: 'firebase-app' })),
    initializeApp: jest.fn(() => ({ name: 'firebase-app' })),
    provideFirebaseApp: (factory: () => unknown) => {
      mockFactories.push(factory);
      return [];
    },
  };
});

jest.mock('@angular/fire/auth', () => {
  const actual = jest.requireActual('@angular/fire/auth');
  return {
    ...actual,
    initializeAuth: jest.fn(() => ({ name: 'auth' })),
    connectAuthEmulator: jest.fn(),
    provideAuth: (factory: () => unknown) => {
      mockFactories.push(factory);
      return [];
    },
  };
});

jest.mock('@angular/fire/storage', () => {
  const actual = jest.requireActual('@angular/fire/storage');
  return {
    ...actual,
    getStorage: jest.fn(() => ({ name: 'storage' })),
    connectStorageEmulator: jest.fn(),
    provideStorage: (factory: () => unknown) => {
      mockFactories.push(factory);
      return [];
    },
  };
});

jest.mock('@angular/fire/firestore', () => {
  const actual = jest.requireActual('@angular/fire/firestore');
  return {
    ...actual,
    getFirestore: jest.fn(() => ({ name: 'firestore' })),
    connectFirestoreEmulator: jest.fn(),
    provideFirestore: (factory: () => unknown) => {
      mockFactories.push(factory);
      return [];
    },
  };
});

jest.mock('@angular/fire/functions', () => {
  const actual = jest.requireActual('@angular/fire/functions');
  return {
    ...actual,
    getFunctions: jest.fn(() => ({ name: 'functions' })),
    connectFunctionsEmulator: jest.fn(),
    provideFunctions: (factory: () => unknown) => {
      mockFactories.push(factory);
      return [];
    },
  };
});

jest.mock('@angular/fire/analytics', () => {
  const actual = jest.requireActual('@angular/fire/analytics');
  return {
    ...actual,
    getAnalytics: jest.fn(() => ({ name: 'analytics' })),
    provideAnalytics: (factory: () => unknown) => {
      mockFactories.push(factory);
      return [];
    },
  };
});

jest.mock('@angular/fire/database', () => {
  const actual = jest.requireActual('@angular/fire/database');
  return {
    ...actual,
    getDatabase: jest.fn(() => ({ name: 'database' })),
    provideDatabase: (factory: () => unknown) => {
      mockFactories.push(factory);
      return [];
    },
  };
});

jest.mock('@angular/fire/performance', () => {
  const actual = jest.requireActual('@angular/fire/performance');
  return {
    ...actual,
    getPerformance: jest.fn(() => ({ name: 'performance' })),
    providePerformance: (factory: () => unknown) => {
      mockFactories.push(factory);
      return [];
    },
  };
});

/**
 * @param providers provider list from a loaded config
 * @returns app initializers stored on that list
 */
function collectInitializers(providers: unknown): Array<() => unknown> {
  const found: Array<() => unknown> = [];
  const visit = (value: unknown): void => {
    if (Array.isArray(value)) {
      value.forEach(visit);
      return;
    }
    if (!value || typeof value !== 'object') {
      return;
    }
    const record = value as {
      provide?: unknown;
      useValue?: unknown;
      ɵproviders?: unknown;
    };
    if ('ɵproviders' in record) {
      visit(record.ɵproviders);
    }
    if (typeof record.useValue !== 'function') {
      return;
    }
    const label = String(record.provide ?? '');
    if (label.includes('Application Initializer') || record.useValue.toString().includes('isolateAuthPersistence')) {
      found.push(record.useValue as () => unknown);
    }
  };
  visit(providers);
  return found;
}

/**
 * @param environment build the config should read
 * @returns a freshly loaded app config
 */
async function loadConfig(environment: AppEnvironment): Promise<ApplicationConfig> {
  mockEnvironment.current = environment;
  mockFactories.length = 0;
  jest.clearAllMocks();
  let config: ApplicationConfig | undefined;
  await jest.isolateModulesAsync(async () => {
    const loaded = await import('./app.config');
    config = loaded.appConfig;
  });
  if (!config) {
    throw new Error('app config did not load');
  }
  const starts = collectInitializers(config.providers);
  if (starts.length === 0) {
    throw new Error('app config did not register an initializer');
  }
  await Promise.all(starts.map((start) => start()));
  await Promise.all(mockFactories.map((factory) => factory()));
  return config;
}

describe('appConfig', () => {
  describe('when the build uses the live project', () => {
    it('should register analytics and skip the emulators', async () => {
      const live = { ...mockEnvironment.current };
      await loadConfig(live);

      expect(initializeApp).toHaveBeenCalledWith(live.firebase, 'portfolio-live');
      expect(getApp).toHaveBeenCalled();
      expect(initializeAuth).toHaveBeenCalledWith(
        { name: 'firebase-app' },
        expect.objectContaining({ persistence: expect.anything() }),
      );
      expect(connectAuthEmulator).not.toHaveBeenCalled();
      expect(connectStorageEmulator).not.toHaveBeenCalled();
      expect(connectFirestoreEmulator).not.toHaveBeenCalled();
      expect(connectFunctionsEmulator).not.toHaveBeenCalled();
      expect(getAnalytics).toHaveBeenCalledWith({ name: 'firebase-app' });
      expect(getDatabase).toHaveBeenCalledWith({ name: 'firebase-app' });
      expect(getPerformance).toHaveBeenCalledWith({ name: 'firebase-app' });
    });
  });

  describe('when the build uses the emulators', () => {
    it('should connect each emulator and skip analytics', async () => {
      const { emulators } = emulatorEnvironment;
      if (!emulators) {
        throw new Error('missing emulator hosts');
      }
      await loadConfig(emulatorEnvironment);

      expect(initializeApp).toHaveBeenCalledWith(emulatorEnvironment.firebase, 'portfolio-emulator');
      expect(connectAuthEmulator).toHaveBeenCalledWith(
        { name: 'auth' },
        `http://${emulators.auth.host}:${emulators.auth.port}`,
        { disableWarnings: true },
      );
      expect(connectStorageEmulator).toHaveBeenCalledWith(
        { name: 'storage' },
        emulators.storage.host,
        emulators.storage.port,
      );
      expect(connectFirestoreEmulator).toHaveBeenCalledWith(
        { name: 'firestore' },
        emulators.firestore.host,
        emulators.firestore.port,
      );
      expect(getFunctions).toHaveBeenCalledWith({ name: 'firebase-app' }, 'us-central1');
      expect(connectFunctionsEmulator).toHaveBeenCalledWith(
        { name: 'functions' },
        emulators.functions.host,
        emulators.functions.port,
      );
      expect(getAnalytics).not.toHaveBeenCalled();
      expect(getDatabase).not.toHaveBeenCalled();
      expect(getPerformance).not.toHaveBeenCalled();
      expect(getStorage).toHaveBeenCalled();
      expect(getFirestore).toHaveBeenCalled();
    });
  });
});
