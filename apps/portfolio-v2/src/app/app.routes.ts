import { Route } from '@angular/router';

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
    loadChildren: () => import('@portfolio-v2/portfolio-pages').then(((route) => route.PAGE_ROUTES)),
  },
  {
    path: 'admin',
    loadChildren: () => import('@portfolio-v2/admin').then(((route) => route.ADMIN_PAGE_ROUTES)),
  },
  { path: '**', loadComponent: () => import('@portfolio-v2/portfolio-pages').then((mod) => mod.PageNotFoundComponent) },
];
