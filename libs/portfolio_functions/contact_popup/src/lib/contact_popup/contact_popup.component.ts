import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button'
import { MatIconModule } from '@angular/material/icon';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ClipboardModule } from '@angular/cdk/clipboard';

import { Inject } from '@angular/core';

@Component({
  selector: 'portfolio-v2-contact-popup',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatDialogModule, MatIconModule, ClipboardModule],
  templateUrl: './contact_popup.component.html',
  styleUrl: './contact_popup.component.css',
})
export class ContactPopupComponent {
  constructor(
    public dialogRef: MatDialogRef<ContactPopupComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { emailAddr: string }
    ) {
  }

  email: string = this.data.emailAddr;

  public closeDialog(): void {
    this.dialogRef.close();
  }
}
