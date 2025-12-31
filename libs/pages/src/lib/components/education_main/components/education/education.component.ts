import {
  ChangeDetectionStrategy,
  Component,
} from '@angular/core';
import { Store } from '@ngrx/store';

import { educationSelector } from '@portfolio-v2/state/selectors';

/**
 * Education Page
 */
@Component({
  selector: 'portfolio-v2-education',
  standalone: true,
  templateUrl: './education.component.html',
  styleUrl: './education.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EducationComponent {
  /** Education information */
  protected readonly educationInfor = this.store.selectSignal(educationSelector);

  /**
   * constructor
   * @param store ngrx store
   */
  constructor(private store: Store) {}
}
