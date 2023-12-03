import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { LandingBannerComponent } from 'libs/portfolio_functions/landing_banner/src/lib/landing_banner/landing_banner.component';
import { AboutMeComponent } from 'libs/portfolio_functions/about_me/src/lib/about_me/about_me.component';
import { SkillsComponent } from 'libs/portfolio_functions/skills/src/lib/skills/skills.component';

@Component({
  standalone: true,
  imports: [RouterModule, LandingBannerComponent, AboutMeComponent, SkillsComponent],
  selector: 'portfolio-v2-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  title: string = 'Pubudu Wijesooriya';
}
