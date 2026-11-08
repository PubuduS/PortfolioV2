import { Routes } from '@angular/router';

import {
  CertificationsComponent,
  EducationComponent,
  EducationMainComponent,
  PublicationsComponent,
} from '@portfolio-v2/portfolio-pages';
import { EDUCATION_ROUTES } from './education.route';

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

describe('EDUCATION_ROUTES', () => {
  describe('when the path is the education hub', () => {
    it('should load the education page', async () => {
      const route = routeAt(EDUCATION_ROUTES, '');

      await expect(route.loadComponent?.()).resolves.toBe(EducationMainComponent);
      expect(route.pathMatch).toBe('full');
    });
  });

  describe('when the path is a child page', () => {
    it.each([
      ['publications', PublicationsComponent],
      ['degrees', EducationComponent],
      ['certificates', CertificationsComponent],
    ])('should load %s', async (path, component) => {
      const route = routeAt(EDUCATION_ROUTES, path);

      await expect(route.loadComponent?.()).resolves.toBe(component);
    });

    it('should send the old education path to degrees', () => {
      expect(routeAt(EDUCATION_ROUTES, 'education').redirectTo).toBe('degrees');
    });
  });
});
