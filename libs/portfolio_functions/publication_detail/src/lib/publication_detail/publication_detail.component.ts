import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule } from '@angular/material/dialog';
import { IPublicationDetails } from '@portfolio-v2/interfaces';
import { ClipboardModule } from '@angular/cdk/clipboard';
import { GetdataService } from '@portfolio-v2/services';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'portfolio-v2-publication-detail',
  standalone: true,
  imports: [CommonModule, MatDialogModule, ClipboardModule, MatIconModule],
  templateUrl: './publication_detail.component.html',
  styleUrl: './publication_detail.component.css',
})
export class PublicationDetailComponent {
  private dataService = inject(GetdataService);
  public readonly pubDetail: IPublicationDetails = this.dataService.getPublicationDetail(this.dataService.getSelectedRecord());
}
