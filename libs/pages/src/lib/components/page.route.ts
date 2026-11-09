import { Routes } from '@angular/router';

/**
 * Public content routes.
 * Loads stay relative. Importing `@portfolio-v2/portfolio-pages` here
 * pulls every page through `src/index.ts`.
 */
export const PAGE_ROUTES: Routes = [
  {
    path: 'aboutme',
    loadComponent: () => import('./about-me/about-me.component').then(
      (mod) => mod.AboutMeComponent,
    ),
  },
  {
    path: 'skills',
    loadComponent: () => import('./skills/skills.component').then(
      (mod) => mod.SkillsComponent,
    ),
  },
  {
    path: 'experience',
    loadComponent: () => import('./experience/experience.component').then(
      (mod) => mod.ExperienceComponent,
    ),
  },
  {
    path: 'portfolio',
    loadChildren: () => import('./portfolio/portfolio.route').then(
      (route) => route.PORTFOLIO_ROUTES,
    ),
  },
  {
    path: 'featured-projects',
    loadComponent: () => import('./portfolio/components/featured-projects/featured-projects.component').then(
      (mod) => mod.FeaturedProjectsComponent,
    ),
  },
  {
    path: 'education',
    loadChildren: () => import('./education-main/education.route').then(
      (route) => route.EDUCATION_ROUTES,
    ),
  },
  {
    path: 'coverletter',
    loadComponent: () => import('./cover-letter/cover-letter.component').then(
      (mod) => mod.CoverLetterComponent,
    ),
  },
  {
    path: 'contact',
    loadComponent: () => import('./contact/contact.component').then(
      (mod) => mod.ContactComponent,
    ),
  },
  {
    path: 'party-mode',
    loadComponent: () => import('./party-mode/party-mode.component').then(
      (mod) => mod.PartyModeComponent,
    ),
  },
  {
    path: 'admin',
    loadComponent: () => import('@portfolio-v2/shared/components').then((mod) => mod.LoginComponent),
  },
];
