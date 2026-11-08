import { Routes } from '@angular/router';

import { FeaturedProjectsComponent } from './components/featured-projects/featured-projects.component';
import { PortfolioComponent } from './portfolio.component';
import { PORTFOLIO_ROUTES } from './portfolio.route';

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

describe('PORTFOLIO_ROUTES', () => {
  describe('when the path is the portfolio hub', () => {
    it('should load the portfolio editor', async () => {
      const route = routeAt(PORTFOLIO_ROUTES, '');

      await expect(route.loadComponent?.()).resolves.toBe(PortfolioComponent);
      expect(route.pathMatch).toBe('full');
    });
  });

  describe('when the path is featured projects', () => {
    it('should load the featured projects editor', async () => {
      const route = routeAt(PORTFOLIO_ROUTES, 'featured-projects');

      await expect(route.loadComponent?.()).resolves.toBe(FeaturedProjectsComponent);
    });
  });
});
