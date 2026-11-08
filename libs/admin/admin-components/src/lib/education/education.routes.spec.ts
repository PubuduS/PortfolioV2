import { Routes } from '@angular/router';

import { EducationMainComponent } from '@portfolio-v2/portfolio-pages';
import { AdminCertificatesComponent } from './certificates/admin-certificates.component';
import { CertificateWriter } from './certificates/services/certificate-writer.service';
import { AdminDegreesComponent } from './degrees/admin-degrees.component';
import { DegreeWriter } from './degrees/services/degree-writer.service';
import { EDUCATION_ADMIN_ROUTES } from './education.routes';
import { AdminPublicationsComponent } from './publications/admin-publications.component';
import { PublicationWriter } from './publications/services/publication-writer.service';

/**
 * @param path route path
 * @returns the matching route
 */
function routeAt(path: string): Routes[number] {
  const route = EDUCATION_ADMIN_ROUTES.find((item) => item.path === path);
  if (!route) {
    throw new Error(`missing route ${path}`);
  }
  return route;
}

describe('EDUCATION_ADMIN_ROUTES', () => {
  describe('when the path is the education hub', () => {
    it('should show the public education page', async () => {
      const hub = routeAt('');

      await expect(hub.loadComponent?.()).resolves.toBe(EducationMainComponent);
      expect(hub.pathMatch).toBe('full');
    });
  });

  describe('when the path is an editor', () => {
    it('should load certificates with their writer', async () => {
      const route = routeAt('certificates');

      await expect(route.loadComponent?.()).resolves.toBe(AdminCertificatesComponent);
      expect(route.providers).toEqual([CertificateWriter]);
    });

    it('should load degrees with their writer', async () => {
      const route = routeAt('degrees');

      await expect(route.loadComponent?.()).resolves.toBe(AdminDegreesComponent);
      expect(route.providers).toEqual([DegreeWriter]);
    });

    it('should load publications with their writer', async () => {
      const route = routeAt('publications');

      await expect(route.loadComponent?.()).resolves.toBe(AdminPublicationsComponent);
      expect(route.providers).toEqual([PublicationWriter]);
    });
  });
});
