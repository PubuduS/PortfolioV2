import { Routes } from '@angular/router';

import { AboutMeWriter } from './about-me/services/about-me-writer.service';
import { DocumentVersionRemover } from './documents/services/document-version-remover';
import { DocumentWriter } from './documents/services/document-writer.service';
import { ExperienceWriter } from './experience/services/experience-writer.service';
import { SkillsWriter } from './skills/services/skills-writer.service';

/**
 * Admin page routes.
 * Loads stay relative. Importing `@portfolio-v2/admin-components`
 * here cycles through `src/index.ts`.
 */
export const ADMIN_PAGE_ROUTES: Routes = [
  {
    path: 'home',
    loadComponent: () => import('./landing-page/landing-page.component').then(
      (mod) => mod.LandingPageComponent,
    ),
  },
  {
    path: 'aboutme',
    providers: [AboutMeWriter],
    loadComponent: () => import('./about-me/about-me.component').then(
      (mod) => mod.AboutMeComponent,
    ),
  },
  {
    path: 'skills',
    providers: [SkillsWriter],
    loadComponent: () => import('./skills/skills.component').then(
      (mod) => mod.SkillsComponent,
    ),
  },
  {
    path: 'experience',
    providers: [ExperienceWriter],
    loadComponent: () => import('./experience/experience.component').then(
      (mod) => mod.AdminExperienceComponent,
    ),
  },
  {
    path: 'portfolio',
    loadChildren: () => import('./portfolio/portfolio.route').then(
      (route) => route.PORTFOLIO_ROUTES,
    ),
  },
  {
    path: 'education',
    loadChildren: () => import('./education/education.routes').then(
      (route) => route.EDUCATION_ADMIN_ROUTES,
    ),
  },
  {
    path: 'resume',
    loadComponent: () => import('./documents/admin-resume-documents.component').then(
      (mod) => mod.AdminResumeDocumentsComponent,
    ),
    providers: [DocumentWriter, DocumentVersionRemover],
    data: { kind: 'resume' },
  },
  {
    path: 'coverletter',
    loadComponent: () => import('./documents/admin-cover-letter-documents.component').then(
      (mod) => mod.AdminCoverLetterDocumentsComponent,
    ),
    providers: [DocumentWriter, DocumentVersionRemover],
    data: { kind: 'cover-letter' },
  },
  {
    path: 'contact',
    loadComponent: () => import('./contact/admin-contact.component').then(
      (mod) => mod.AdminContactComponent,
    ),
  },
  {
    path: 'analytics',
    loadComponent: () => import('./analytics/analytics-dashboard.component').then(
      (mod) => mod.AnalyticsDashboardComponent,
    ),
  },
];
