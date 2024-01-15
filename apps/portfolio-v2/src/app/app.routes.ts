import { Route } from '@angular/router';

export const appRoutes: Route[] = [
    { path: 'home', loadComponent: () => import('@portfolio-v2/landing_banner').then(mod => mod.LandingBannerComponent) },
    { path: 'aboutme', loadComponent: () => import('@portfolio-v2/about_me').then(mod => mod.AboutMeComponent) },
    { path: 'skills', loadComponent: () => import('@portfolio-v2/skills').then(mod => mod.SkillsComponent) },
    { path: 'experience', loadComponent: () => import('@portfolio-v2/experience').then(mod => mod.ExperienceComponent) },
    { path: 'portfolio', loadComponent: () => import('@portfolio-v2/portfolio').then(mod => mod.PortfolioComponent) },
    { path: 'featured-projects', loadComponent: () => import('@portfolio-v2/featured_projects').then(mod => mod.FeaturedProjectsComponent) },
    { path: 'education', loadComponent: () => import('@portfolio-v2/education_main').then(mod => mod.EducationMainComponent) },
    { path: 'coverletter', loadComponent: () => import('@portfolio-v2/cover_letter').then(mod => mod.CoverLetterComponent) },
    { path: 'contact', loadComponent: () => import('@portfolio-v2/contact').then(mod => mod.ContactComponent) },
    { path: '', redirectTo: 'home', pathMatch: 'full' },
    { path: '**', loadComponent: () => import('@portfolio-v2/page_not_found').then(mod => mod.PageNotFoundComponent) },
];
