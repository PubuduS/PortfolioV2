import {
  ChangeDetectionStrategy,
  Component,
} from '@angular/core';
import {
  MatDialogActions,
  MatDialogContent,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Store } from '@ngrx/store';

import {
  projectCardSelector,
  selectedCardIDSelector,
} from '@portfolio-v2/state/selectors';

/**
 * Project Cards Component
 */
@Component({
  selector: 'admin-project-cards',
  imports: [
    MatDialogContent,
    MatDialogActions,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './project-cards.component.html',
  styleUrl: './project-cards.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectCardsComponent {
  /** Selected card ID */
  private readonly cardId = this.store.selectSignal(selectedCardIDSelector)();
  /** Selected project card */
  protected readonly projectCard = this.store.selectSignal(projectCardSelector(this.cardId));

  /**
   * constructor
   * @param store ngrx store
   */
  constructor(private store: Store) {}
}
