import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { LandingBannerComponent } from 'libs/portfolio_functions/landing_banner/src/lib/landing_banner/landing_banner.component';
import { AboutMeComponent } from 'libs/portfolio_functions/about_me/src/lib/about_me/about_me.component';
import { SkillsComponent } from 'libs/portfolio_functions/skills/src/lib/skills/skills.component';
import { ExperienceComponent } from 'libs/portfolio_functions/experience/src/lib/experience/experience.component';
import { FeaturedProjectsComponent } from 'libs/portfolio_functions/featured_projects/src/lib/featured_projects/featured_projects.component';
import { PortfolioComponent } from 'libs/portfolio_functions/portfolio/src/lib/portfolio/portfolio.component';
import { EducationComponent } from 'libs/portfolio_functions/education/src/lib/education/education.component';

@Component({
  standalone: true,
  imports: [RouterModule, LandingBannerComponent, AboutMeComponent, SkillsComponent, ExperienceComponent, FeaturedProjectsComponent, PortfolioComponent, EducationComponent],
  selector: 'portfolio-v2-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  title: string = 'Pubudu Wijesooriya';
}
