import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';

/**
 * Add control shared by the education lists.
 */
@Component({
  selector: 'admin-add-record',
  standalone: true,
  imports: [MatButtonModule],
  templateUrl: './add-record.component.html',
  styleUrl: './add-record.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddRecordComponent {
  /** Accessible name for the add icon. */
  public readonly label = input.required<string>();

  /** The page opens its dialog. */
  public readonly add = output<void>();
}
