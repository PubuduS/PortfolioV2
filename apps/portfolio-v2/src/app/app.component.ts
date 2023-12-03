import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { LandingBannerComponent } from 'libs/portfolio_functions/landing_banner/src/lib/landing_banner/landing_banner.component';

@Component({
  standalone: true,
  imports: [RouterModule, LandingBannerComponent],
  selector: 'portfolio-v2-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  title: string = 'Pubudu Wijesooriya';
}
