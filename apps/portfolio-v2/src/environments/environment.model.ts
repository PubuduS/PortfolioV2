/** Host and port of one local Firebase emulator. */
export interface EmulatorEndpoint {
  /** Hostname of the emulator, usually `localhost`. */
  host: string;
  /** Port the emulator listens on. */
  port: number;
}

/** Firebase web app config passed to `initializeApp`. */
export interface FirebaseWebConfig {
  /** Web API key for this Firebase project. */
  apiKey: string;
  /** Auth domain for this Firebase project. */
  authDomain: string;
  /** Firebase project id. */
  projectId: string;
  /** Default Cloud Storage bucket. */
  storageBucket: string;
  /** Sender id used by Cloud Messaging. */
  messagingSenderId: string;
  /** Firebase web app id. */
  appId: string;
  /** Google Analytics measurement id, when analytics is enabled. */
  measurementId?: string;
}

/** Shape shared by every build environment of the app. */
export interface AppEnvironment {
  /** Firebase project this build talks to. */
  firebase: FirebaseWebConfig;
  /** Key for the OpenWeather request. */
  openWeatherAPIKey: string;
  /** Whether this build is a production build. */
  production: boolean;
  /** Whether this build is a local development build. */
  development: boolean;
  /** Local emulator hosts. Absent when the build uses the live project. */
  emulators?: {
    firestore: EmulatorEndpoint;
    auth: EmulatorEndpoint;
    storage: EmulatorEndpoint;
    functions: EmulatorEndpoint;
  };
}
