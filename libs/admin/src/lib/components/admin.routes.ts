import { Routes } from '@angular/router';

/** Admin Pages Routes */
export const ADMIN_PAGE_ROUTES: Routes = [
  {
    path: 'home',
    loadComponent: () => import('@portfolio-v2/admin').then((mod) => mod.LandingPageComponent),
  },
  {
    path: 'aboutme',
    loadComponent: () => import('@portfolio-v2/admin').then((mod) => mod.AboutMeComponent),
  },
];
