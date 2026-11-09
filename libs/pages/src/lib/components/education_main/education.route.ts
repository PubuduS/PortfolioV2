import { Routes } from '@angular/router';

/**
 * Public routes for the education section and its child pages.
 * Loads stay relative so this file does not pull the pages barrel.
 */
export const EDUCATION_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('./education_main.component').then(
      (mod) => mod.EducationMainComponent,
    ),
  },
  {
    path: 'publications',
    loadComponent: () => import('./components/publications/publications.component').then(
      (mod) => mod.PublicationsComponent,
    ),
  },
  {
    path: 'degrees',
    loadComponent: () => import('./components/education/education.component').then(
      (mod) => mod.EducationComponent,
    ),
  },
  {
    path: 'education',
    redirectTo: 'degrees',
  },
  {
    path: 'certificates',
    loadComponent: () => import('./components/certifications/certifications.component').then(
      (mod) => mod.CertificationsComponent,
    ),
  },
];
