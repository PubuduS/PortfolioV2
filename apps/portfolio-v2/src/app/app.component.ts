import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { LandingBannerComponent } from '@portfolio-v2/landing_banner';
import { AboutMeComponent } from '@portfolio-v2/about_me';
import { SkillsComponent } from '@portfolio-v2/skills';
import { ExperienceComponent } from '@portfolio-v2/experience';
import { FeaturedProjectsComponent } from '@portfolio-v2/featured_projects';
import { PortfolioComponent } from '@portfolio-v2/portfolio';
import { EducationComponent } from '@portfolio-v2/education';
import { CertificationsComponent } from '@portfolio-v2/certifications';
import { ContactComponent } from '@portfolio-v2/contact';

@Component({
  standalone: true,
  imports: [RouterModule, LandingBannerComponent, AboutMeComponent, SkillsComponent, ExperienceComponent, 
            FeaturedProjectsComponent, PortfolioComponent, EducationComponent, CertificationsComponent, ContactComponent],
  selector: 'portfolio-v2-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  title: string = 'Pubudu Wijesooriya';
}
