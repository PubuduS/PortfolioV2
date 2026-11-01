import { Route } from '@angular/router';

import { adminGuard } from '@portfolio-v2/shared/services';

/** Top-level routes for the public site and the admin area. */
export const appRoutes: Route[] = [
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },
  {
    path: 'home',
    loadComponent: () => import('@portfolio-v2/portfolio-pages').then((mod) => mod.LandingBannerComponent),
  },
  {
    path: 'content',
    loadChildren: () => import('@portfolio-v2/portfolio-pages').then((route) => route.PAGE_ROUTES),
  },
  {
    path: 'admin',
    canActivate: [adminGuard],
    loadChildren: () => import('@portfolio-v2/admin-components').then((route) => route.ADMIN_PAGE_ROUTES),
  },
  { path: '**', loadComponent: () => import('@portfolio-v2/portfolio-pages').then((mod) => mod.PageNotFoundComponent) },
];
