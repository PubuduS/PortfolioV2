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
 * Project Card
 */
@Component({
  selector: 'portfolio-v2-project-card',
  standalone: true,
  imports: [
    MatDialogContent,
    MatDialogActions,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './project_card.component.html',
  styleUrl: './project_card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectCardComponent {
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
