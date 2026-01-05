import {
  ChangeDetectionStrategy,
  Component,
  input,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { IUpdateDeleteBtnConfigs } from '../types';

/**
 * Update Delete Buttons Component
 */
@Component({
  selector: 'admin-update-delete-buttons',
  imports: [
    MatButtonModule,
    MatIconModule,
  ],
  standalone: true,
  templateUrl: './update-delete-buttons.component.html',
  styleUrl: './update-delete-buttons.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UpdateDeleteButtonsComponent {
  public readonly config = input.required<IUpdateDeleteBtnConfigs>();
}
