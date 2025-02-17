import { Routes } from '@angular/router';

export const EDUCATION_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('@portfolio-v2/portfolio-pages').then((mod) => mod.EducationMainComponent),
  },
  {
    path: 'publications',
    loadComponent: () => import('@portfolio-v2/portfolio-pages').then((mod) => mod.PublicationsComponent),
  },
  {
    path: 'education',
    loadComponent: () => import('@portfolio-v2/portfolio-pages').then((mod) => mod.EducationComponent),
  },
  {
    path: 'certificates',
    loadComponent: () => import('@portfolio-v2/portfolio-pages').then((mod) => mod.CertificationsComponent),
  },
];
