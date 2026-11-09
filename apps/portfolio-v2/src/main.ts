import { bootstrapApplication } from '@angular/platform-browser';
import {
  enableProdMode,
  provideZonelessChangeDetection,
} from '@angular/core';

import { environment } from '@portfolio-v2/environment';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

if (environment.production) {
  enableProdMode();
}

bootstrapApplication(
  AppComponent,
  {
    ...appConfig,
    providers: [
      provideZonelessChangeDetection(),
      ...appConfig.providers,
    ],
  },
).catch((err) => console.error(err));
