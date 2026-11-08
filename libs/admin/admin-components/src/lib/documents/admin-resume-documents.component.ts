import {
  ChangeDetectionStrategy,
  Component,
} from '@angular/core';

import { AdminDocumentsComponent } from './admin-documents.component';

/**
 * Resume route. A separate host so the outlet can replace the cover-letter page.
 */
@Component({
  selector: 'admin-resume-documents',
  standalone: true,
  imports: [AdminDocumentsComponent],
  template: '<admin-documents />',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminResumeDocumentsComponent {}
