import { Routes } from '@angular/router';

import { CertificateWriter } from './certificates/services/certificate-writer.service';
import { PublicationWriter } from './publications/services/publication-writer.service';

/** Admin routes for education content. Each writer is provided only on its own route. */
export const EDUCATION_ADMIN_ROUTES: Routes = [
  {
    path: 'certificates',
    providers: [CertificateWriter],
    loadComponent: () => import('./certificates/admin-certificates.component').then(
      (mod) => mod.AdminCertificatesComponent,
    ),
  },
  {
    path: 'publications',
    providers: [PublicationWriter],
    loadComponent: () => import('./publications/admin-publications.component').then(
      (mod) => mod.AdminPublicationsComponent,
    ),
  },
];
