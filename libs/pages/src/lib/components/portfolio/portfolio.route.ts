import { Routes } from '@angular/router';

/**
 * Public routes for the portfolio section and featured projects.
 * Loads stay relative so this file does not pull the pages barrel.
 */
export const PORTFOLIO_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('./portfolio.component').then(
      (mod) => mod.PortfolioComponent,
    ),
  },
  {
    path: 'featured-projects',
    loadComponent: () => import('./components/featured-projects/featured-projects.component').then(
      (mod) => mod.FeaturedProjectsComponent,
    ),
  },
];
