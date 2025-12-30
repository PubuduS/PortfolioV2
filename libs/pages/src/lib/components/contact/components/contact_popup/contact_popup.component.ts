import {
  ChangeDetectionStrategy,
  Component,
  Inject,
} from '@angular/core';
import {
  MatDialogModule,
  MatDialogRef,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ClipboardModule } from '@angular/cdk/clipboard';

/**
 * When user click the email button under Follow me this will pop up
 */
@Component({
  selector: 'portfolio-v2-contact-popup',
  standalone: true,
  imports: [MatButtonModule, MatDialogModule, MatIconModule, ClipboardModule],
  templateUrl: './contact_popup.component.html',
  styleUrl: './contact_popup.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContactPopupComponent {
  /**
   * constructor
   * @param dialogRef Dialog ref
   * @param data data
   * @param data.emailAddr email address
   */
  constructor(
    public dialogRef: MatDialogRef<ContactPopupComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { emailAddr: string },
  ) {
  }

  /** Email address */
  public readonly email: string = this.data.emailAddr;

  /** Close dialog */
  public closeDialog(): void {
    this.dialogRef.close();
  }
}
