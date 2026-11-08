import {
  ChangeDetectionStrategy,
  Component,
} from '@angular/core';

import { AdminDocumentsComponent } from './admin-documents.component';

/**
 * Cover-letter route. A separate host so the outlet can replace the resume page.
 */
@Component({
  selector: 'admin-cover-letter-documents',
  standalone: true,
  imports: [AdminDocumentsComponent],
  template: '<admin-documents />',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminCoverLetterDocumentsComponent {}
