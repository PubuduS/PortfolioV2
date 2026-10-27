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
    path: 'degrees',
    loadComponent: () => import('@portfolio-v2/portfolio-pages').then((mod) => mod.EducationComponent),
  },
  {
    path: 'education',
    redirectTo: 'degrees',
  },
  {
    path: 'certificates',
    loadComponent: () => import('@portfolio-v2/portfolio-pages').then((mod) => mod.CertificationsComponent),
  },
];
