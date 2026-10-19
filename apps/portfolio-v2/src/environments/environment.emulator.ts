import { AppEnvironment } from './environment.model';

/** Local Firebase Emulator Suite environment. Holds only fake values. */
export const environment: AppEnvironment = {
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
  },
};
