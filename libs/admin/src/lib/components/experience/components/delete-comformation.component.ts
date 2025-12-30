import {
  ChangeDetectionStrategy,
  Component,
  Inject,
  OnInit,
} from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { IExperience } from '@portfolio-v2/state/dataModels';

/**
 * Delete Confirmation Component
 */
@Component({
  selector: 'admin-delete-comformation',
  standalone: true,
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './delete-comformation.component.html',
  styleUrl: './delete-comformation.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeleteComformationComponent implements OnInit {
  /** Points */
  protected points: string[] = [];

  /** Records */
  protected records: [string, any][] = [];

  /**
   * constructor
   * @param dialogRef Dialog ref
   * @param data data
   * @param data.record experience record
   */
  constructor(
    public dialogRef: MatDialogRef<DeleteComformationComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { record: IExperience },
  ) {}

  /**
   * @inheritdoc
   */
  public ngOnInit(): void {
    this.getExperienceRecord();
  }

  /**
   * Get experience record
   */
  private getExperienceRecord(): void {
    if (!this.data?.record) {
      return;
    }

    const { points, ...rest } = this.data.record;
    this.points = points || [];
    this.records = Object.entries(rest);
  }
}
