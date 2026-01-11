import { Routes } from '@angular/router';

/** Admin Pages Routes */
export const ADMIN_PAGE_ROUTES: Routes = [
  {
    path: 'home',
    loadComponent: () => import('@portfolio-v2/admin-components').then((mod) => mod.LandingPageComponent),
  },
  {
    path: 'aboutme',
    loadComponent: () => import('@portfolio-v2/admin-components').then((mod) => mod.AboutMeComponent),
  },
  {
    path: 'skills',
    loadComponent: () => import('@portfolio-v2/admin-components').then((mod) => mod.SkillsComponent),
  },
  {
    path: 'experience',
    loadComponent: () => import('@portfolio-v2/admin-components').then((mod) => mod.AdminExperienceComponent),
  },
  {
    path: 'portfolio',
    loadChildren: () => import('@portfolio-v2/admin-components').then((route) => route.PORTFOLIO_ROUTES),
  },
];
