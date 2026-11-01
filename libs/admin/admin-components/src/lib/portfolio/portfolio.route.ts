import { Routes } from '@angular/router';

/** Admin routes for the portfolio section and featured projects. */
export const PORTFOLIO_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('@portfolio-v2/admin-components').then((mod) => mod.PortfolioComponent),
  },
  {
    path: 'featured-projects',
    loadComponent: () => import('@portfolio-v2/admin-components').then((mod) => mod.FeaturedProjectsComponent),
  },
];
