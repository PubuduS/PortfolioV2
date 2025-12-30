import { bootstrapApplication } from '@angular/platform-browser';
import {
  enableProdMode,
  provideZoneChangeDetection,
} from '@angular/core';

import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { environment } from './environments';

if (environment.production) {
  enableProdMode();
}

bootstrapApplication(
  AppComponent,
  {
    ...appConfig,
    providers: [provideZoneChangeDetection(),
      ...appConfig.providers],
  },
).catch((err) => console.error(err));
