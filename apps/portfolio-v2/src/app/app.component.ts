import { Component } from '@angular/core';
import {
  RouterModule,
  RouterLink,
  RouterOutlet,
} from '@angular/router';

import {
  EducationComponent,
  CertificationsComponent,
  PublicationsComponent,
  PartyModeComponent,
} from '@portfolio-v2/portfolio-pages';
import { WeatherDisplayComponent } from '@portfolio-v2/shared/components';

/** Main Component */
@Component({
  standalone: true,
  imports: [
    RouterModule,
    RouterOutlet,
    RouterLink,
    EducationComponent,
    CertificationsComponent,
    PublicationsComponent,
    PartyModeComponent,
    WeatherDisplayComponent,
  ],
  selector: 'portfolio-v2-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  /** Page title */
  public readonly title = 'Pubudu Wijesooriya';
}
