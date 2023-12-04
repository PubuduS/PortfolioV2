import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { LandingBannerComponent } from 'libs/portfolio_functions/landing_banner/src/lib/landing_banner/landing_banner.component';
import { AboutMeComponent } from 'libs/portfolio_functions/about_me/src/lib/about_me/about_me.component';
import { SkillsComponent } from 'libs/portfolio_functions/skills/src/lib/skills/skills.component';
import { ExperienceComponent } from 'libs/portfolio_functions/experience/src/lib/experience/experience.component';

@Component({
  standalone: true,
  imports: [RouterModule, LandingBannerComponent, AboutMeComponent, SkillsComponent, ExperienceComponent],
  selector: 'portfolio-v2-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  title: string = 'Pubudu Wijesooriya';
}
