import { Routes } from '@angular/router';

import { ADMIN_PAGE_ROUTES } from '@portfolio-v2/admin-components';
import {
  LandingBannerComponent,
  PAGE_ROUTES,
  PageNotFoundComponent,
} from '@portfolio-v2/portfolio-pages';
import {
  adminGuard,
  modeGuard,
} from '@portfolio-v2/shared/services';
import { appRoutes } from './app.routes';

/**
 * @param routes route table
 * @param path route path
 * @returns the matching route
 */
function routeAt(routes: Routes, path: string): Routes[number] {
  const route = routes.find((item) => item.path === path);
  if (!route) {
    throw new Error(`missing route ${path}`);
  }
  return route;
}

describe('appRoutes', () => {
  describe('when the path is empty', () => {
    it('should redirect to home', () => {
      expect(routeAt(appRoutes, '')).toEqual({
        path: '',
        redirectTo: 'home',
        pathMatch: 'full',
      });
    });
  });

  describe('when the path is a public page', () => {
    it('should load the home banner behind the mode guard', async () => {
      const route = routeAt(appRoutes, 'home');

      await expect(route.loadComponent?.()).resolves.toBe(LandingBannerComponent);
      expect(route.canActivate).toEqual([modeGuard]);
    });

    it('should load the content children behind the mode guard', async () => {
      const route = routeAt(appRoutes, 'content');

      await expect(route.loadChildren?.()).resolves.toBe(PAGE_ROUTES);
      expect(route.canActivate).toEqual([modeGuard]);
    });

    it('should load the not-found page for an unknown path', async () => {
      const route = routeAt(appRoutes, '**');

      await expect(route.loadComponent?.()).resolves.toBe(PageNotFoundComponent);
    });
  });

  describe('when the path is the admin area', () => {
    it('should load the admin children behind both guards', async () => {
      const route = routeAt(appRoutes, 'admin');

      await expect(route.loadChildren?.()).resolves.toBe(ADMIN_PAGE_ROUTES);
      expect(route.canActivate).toEqual([adminGuard, modeGuard]);
    });
  });
});
