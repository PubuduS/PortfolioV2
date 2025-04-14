import { Routes } from '@angular/router';

/** Page routes */
export const PAGE_ROUTES: Routes = [
  {
    path: 'aboutme',
    loadComponent: () => import('@portfolio-v2/portfolio-pages').then((mod) => mod.AboutMeComponent),
  },
  {
    path: 'skills',
    loadComponent: () => import('@portfolio-v2/portfolio-pages').then((mod) => mod.SkillsComponent),
  },
  {
    path: 'experience',
    loadComponent: () => import('@portfolio-v2/portfolio-pages').then((mod) => mod.ExperienceComponent),
  },
  {
    path: 'portfolio',
    loadChildren: () => import('@portfolio-v2/portfolio-pages').then((route) => route.PORTFOLIO_ROUTES),
  },
  {
    path: 'featured-projects',
    loadComponent: () => import('@portfolio-v2/portfolio-pages').then((mod) => mod.FeaturedProjectsComponent),
  },
  {
    path: 'education',
    loadChildren: () => import('@portfolio-v2/portfolio-pages').then((route) => route.EDUCATION_ROUTES),
  },
  {
    path: 'coverletter',
    loadComponent: () => import('@portfolio-v2/portfolio-pages').then((mod) => mod.CoverLetterComponent),
  },
  {
    path: 'contact',
    loadComponent: () => import('@portfolio-v2/portfolio-pages').then((mod) => mod.ContactComponent),
  },
  {
    path: 'party-mode',
    loadComponent: () => import('@portfolio-v2/portfolio-pages').then((mod) => mod.PartyModeComponent),
  },
  {
    path: 'admin',
    loadComponent: () => import('@portfolio-v2/shared/components').then((mod) => mod.LoginComponent),
  },
];
