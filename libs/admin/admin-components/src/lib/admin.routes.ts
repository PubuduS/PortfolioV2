import { Routes } from '@angular/router';

import { DocumentWriter } from './documents/services/document-writer.service';

/** Admin Pages Routes */
export const ADMIN_PAGE_ROUTES: Routes = [
  {
    path: 'home',
    loadComponent: () => import('@portfolio-v2/admin-components').then((mod) => mod.LandingPageComponent),
  },
  {
    path: 'aboutme',
    loadComponent: () => import('@portfolio-v2/admin-components').then((mod) => mod.AboutMeComponent),
  },
  {
    path: 'skills',
    loadComponent: () => import('@portfolio-v2/admin-components').then((mod) => mod.SkillsComponent),
  },
  {
    path: 'experience',
    loadComponent: () => import('@portfolio-v2/admin-components').then((mod) => mod.AdminExperienceComponent),
  },
  {
    path: 'portfolio',
    loadChildren: () => import('@portfolio-v2/admin-components').then((route) => route.PORTFOLIO_ROUTES),
  },
  {
    path: 'education',
    loadChildren: () => import('@portfolio-v2/admin-components').then(
      (route) => route.EDUCATION_ADMIN_ROUTES,
    ),
  },
  {
    path: 'resume',
    loadComponent: () => import('./documents/admin-documents.component').then(
      (mod) => mod.AdminDocumentsComponent,
    ),
    providers: [DocumentWriter],
    data: { kind: 'resume' },
  },
  {
    path: 'coverletter',
    loadComponent: () => import('./documents/admin-documents.component').then(
      (mod) => mod.AdminDocumentsComponent,
    ),
    providers: [DocumentWriter],
    data: { kind: 'cover-letter' },
  },
];
