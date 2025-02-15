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
    loadComponent: () => import('@portfolio-v2/portfolio-pages').then((mod) => mod.PortfolioComponent),
  },
  {
    path: 'featured-projects',
    loadComponent: () => import('@portfolio-v2/portfolio-pages').then((mod) => mod.FeaturedProjectsComponent),
  },
  {
    path: 'education',
    loadComponent: () => import('@portfolio-v2/portfolio-pages').then((mod) => mod.EducationMainComponent),
  },
  {
    path: 'coverletter',
    loadComponent: () => import('@portfolio-v2/portfolio-pages').then((mod) => mod.CoverLetterComponent),
  },
  {
    path: 'contact',
    loadComponent: () => import('@portfolio-v2/portfolio-pages').then((mod) => mod.ContactComponent),
  },
];
