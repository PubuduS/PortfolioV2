import { Routes } from '@angular/router';

import { PublicationWriter } from './publications/services/publication-writer.service';

/** Admin routes for education content. The writer is provided only on this route. */
export const EDUCATION_ADMIN_ROUTES: Routes = [
  {
    path: 'publications',
    providers: [PublicationWriter],
    loadComponent: () => import('./publications/admin-publications.component').then(
      (mod) => mod.AdminPublicationsComponent,
    ),
  },
];
