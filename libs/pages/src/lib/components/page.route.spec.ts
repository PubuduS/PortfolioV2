import { Routes } from '@angular/router';

import {
  AboutMeComponent,
  ContactComponent,
  CoverLetterComponent,
  EDUCATION_ROUTES,
  ExperienceComponent,
  FeaturedProjectsComponent,
  PAGE_ROUTES,
  PORTFOLIO_ROUTES,
  PartyModeComponent,
  SkillsComponent,
} from '@portfolio-v2/portfolio-pages';
import { LoginComponent } from '@portfolio-v2/shared/components';

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

describe('PAGE_ROUTES', () => {
  describe('when the path loads one page', () => {
    it.each([
      ['aboutme', AboutMeComponent],
      ['skills', SkillsComponent],
      ['experience', ExperienceComponent],
      ['featured-projects', FeaturedProjectsComponent],
      ['coverletter', CoverLetterComponent],
      ['contact', ContactComponent],
      ['party-mode', PartyModeComponent],
      ['admin', LoginComponent],
    ])('should load %s', async (path, component) => {
      const route = routeAt(PAGE_ROUTES, path);

      await expect(route.loadComponent?.()).resolves.toBe(component);
    });
  });

  describe('when the path has child routes', () => {
    it('should load the portfolio children', async () => {
      const route = routeAt(PAGE_ROUTES, 'portfolio');

      await expect(route.loadChildren?.()).resolves.toBe(PORTFOLIO_ROUTES);
    });

    it('should load the education children', async () => {
      const route = routeAt(PAGE_ROUTES, 'education');

      await expect(route.loadChildren?.()).resolves.toBe(EDUCATION_ROUTES);
    });
  });
});
