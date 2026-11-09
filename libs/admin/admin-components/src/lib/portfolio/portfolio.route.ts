import { Routes } from '@angular/router';

import { PortfolioWriter } from './services/portfolio-writer.service';

/**
 * Admin routes for the portfolio section and featured projects.
 * Relative loads avoid a cycle through `src/index.ts`.
 * The writer is provided on both pages so their dialogs can see it.
 */
export const PORTFOLIO_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    providers: [PortfolioWriter],
    loadComponent: () => import('./portfolio.component').then(
      (mod) => mod.PortfolioComponent,
    ),
  },
  {
    path: 'featured-projects',
    providers: [PortfolioWriter],
    loadComponent: () => import('./components/featured-projects/featured-projects.component').then(
      (mod) => mod.FeaturedProjectsComponent,
    ),
  },
];
