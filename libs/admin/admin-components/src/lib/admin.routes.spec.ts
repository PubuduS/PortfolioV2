import { Routes } from '@angular/router';

import { AboutMeComponent } from './about-me/about-me.component';
import { ADMIN_PAGE_ROUTES } from './admin.routes';
import { AnalyticsDashboardComponent } from './analytics/analytics-dashboard.component';
import { AdminContactComponent } from './contact/admin-contact.component';
import { AdminCoverLetterDocumentsComponent } from './documents/admin-cover-letter-documents.component';
import { AdminResumeDocumentsComponent } from './documents/admin-resume-documents.component';
import { DocumentVersionRemover } from './documents/services/document-version-remover';
import { DocumentWriter } from './documents/services/document-writer.service';
import { EDUCATION_ADMIN_ROUTES } from './education/education.routes';
import { AdminExperienceComponent } from './experience/experience.component';
import { LandingPageComponent } from './landing-page/landing-page.component';
import { PORTFOLIO_ROUTES } from './portfolio/portfolio.route';
import { SkillsComponent } from './skills/skills.component';

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

describe('ADMIN_PAGE_ROUTES', () => {
  describe('when the path loads one page', () => {
    it.each([
      ['home', LandingPageComponent],
      ['aboutme', AboutMeComponent],
      ['skills', SkillsComponent],
      ['experience', AdminExperienceComponent],
      ['contact', AdminContactComponent],
      ['analytics', AnalyticsDashboardComponent],
    ])('should load %s', async (path, component) => {
      const route = routeAt(ADMIN_PAGE_ROUTES, path);

      await expect(route.loadComponent?.()).resolves.toBe(component);
    });
  });

  describe('when the path has child routes', () => {
    it('should load the portfolio children', async () => {
      const route = routeAt(ADMIN_PAGE_ROUTES, 'portfolio');

      await expect(route.loadChildren?.()).resolves.toBe(PORTFOLIO_ROUTES);
    });

    it('should load the education children', async () => {
      const route = routeAt(ADMIN_PAGE_ROUTES, 'education');

      await expect(route.loadChildren?.()).resolves.toBe(EDUCATION_ADMIN_ROUTES);
    });
  });

  describe('when the path is a document page', () => {
    it('should load the resume editor with its writer', async () => {
      const route = routeAt(ADMIN_PAGE_ROUTES, 'resume');

      await expect(route.loadComponent?.()).resolves.toBe(AdminResumeDocumentsComponent);
      expect(route.providers).toEqual([DocumentWriter, DocumentVersionRemover]);
      expect(route.data).toEqual({ kind: 'resume' });
    });

    it('should load the cover letter editor with its writer', async () => {
      const route = routeAt(ADMIN_PAGE_ROUTES, 'coverletter');

      await expect(route.loadComponent?.()).resolves.toBe(AdminCoverLetterDocumentsComponent);
      expect(route.providers).toEqual([DocumentWriter, DocumentVersionRemover]);
      expect(route.data).toEqual({ kind: 'cover-letter' });
    });
  });
});
