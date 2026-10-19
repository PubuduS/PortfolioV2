/** Host and port of one local Firebase emulator. */
export interface EmulatorEndpoint {
  host: string;
  port: number;
}

/** Firebase web app config passed to `initializeApp`. */
export interface FirebaseWebConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
}

/** Shape shared by every build environment of the app. */
export interface AppEnvironment {
  firebase: FirebaseWebConfig;
  openWeatherAPIKey: string;
  production: boolean;
  development: boolean;
  emulators?: {
    firestore: EmulatorEndpoint;
    auth: EmulatorEndpoint;
    storage: EmulatorEndpoint;
  };
}
