import { Component } from '@angular/core';
import { RouterModule, RouterLink, RouterOutlet } from '@angular/router';
import { EducationComponent } from '@portfolio-v2/education';
import { CertificationsComponent } from '@portfolio-v2/certifications';
import { WeatherDisplayComponent } from '@portfolio-v2/weather_display';
import { PublicationsComponent } from '@portfolio-v2/publications';
import { PartyModeComponent } from '@portfolio-v2/party_mode';

/** Main Component */
@Component({
  standalone: true,
  imports: [RouterModule, RouterOutlet, RouterLink, EducationComponent, CertificationsComponent, WeatherDisplayComponent, PublicationsComponent, PartyModeComponent ],
  selector: 'portfolio-v2-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  /** Page title */
  public readonly title = 'Pubudu Wijesooriya';
}
