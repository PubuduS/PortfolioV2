import { Routes } from '@angular/router';

/**
 * Admin routes for the portfolio section and featured projects.
 * Relative loads avoid a cycle through `src/index.ts`.
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
