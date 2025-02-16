import { ApplicationConfig } from '@angular/core';
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
  getAuth,
  provideAuth,
} from '@angular/fire/auth';
import {
  getFirestore,
  provideFirestore,
} from '@angular/fire/firestore';
import {
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

import { environment } from '../environments/environment';
import { appRoutes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(),
    provideRouter(appRoutes),
    provideAnimations(),
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideAnalytics(() => getAnalytics()),
    provideAuth(() => getAuth()),
    provideStorage(() => getStorage()),
    provideDatabase(() => getDatabase()),
    provideFirestore(() => getFirestore()),
    providePerformance(() => getPerformance()),
    ScreenTrackingService,
    UserTrackingService,
  ],
};
