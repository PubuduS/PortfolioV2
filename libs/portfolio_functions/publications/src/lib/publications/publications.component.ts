import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { IPublication } from '@portfolio-v2/interfaces';
import { PublicationDetailComponent } from '@portfolio-v2/publication_detail';
import { GetdataService } from '@portfolio-v2/services';

@Component({
  selector: 'portfolio-v2-publications',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatCardModule, MatDialogModule, MatIconModule, PublicationDetailComponent],
  templateUrl: './publications.component.html',
  styleUrl: './publications.component.css',
})
export class PublicationsComponent {
  private dialog = inject(MatDialog);
  private dataService = inject(GetdataService);

  public readonly publicationList : IPublication[] = [
    {
      title: 'ARWalker',
      subTitle: 'Gait Rehabilitation, Mixed Reality, HoloLens 2',
      imageUrl: 'assets/images/publications/Researcher.jpeg',
      shortDesc: 'The paper investigates the use of Augmented Reality (AR) in biomechanics through ARWalker, an application enabling participants, especially older adults and those with diseases, to synchronize their gait with virtual companions, ultimately reducing the risk of falls.',
      btnMoreDisable: false,
      btnDownloadDisable: false,
      downloadUrl: 'assets/PDFs/Publications/ARWalker.pdf',
      downloadFileName: 'ARWalker'
    },
    {
      title: 'A Study of the Hololens Application Store',
      subTitle: 'System Analysis, Mixed Reality, HoloLens 2',
      imageUrl: 'assets/images/publications/HLStoreImg.jpeg',
      shortDesc: 'This paper investigates the landscape of Augmented Reality (AR) applications based on Head-Mounted Displays (HMDs), particularly focusing on those available on the Microsoft Hololens application store, examining their characteristics and system performance to provide valuable insights to the research community.',
      btnMoreDisable: false,
      btnDownloadDisable: false,
      downloadUrl: 'assets/PDFs/Publications/HLStore.pdf',
      downloadFileName: 'HLStore'
    },
    {
      title: 'Gait Rehabillitation with Mixed Reality',
      subTitle: 'Gait Rehabilitation, Mixed Reality, HoloLens 2',
      imageUrl: 'assets/images/publications/Thesis.jpg',
      shortDesc: 'This study introduces two portable mixed reality systems for gait training in individuals with gait disabilities, employing an avatar-based approach backed by the proteus effect and complexity matching theories, as well as a system using rhythmic visual cues through a moving bar, with promising pilot study results and ongoing large-scale human trials to evaluate their effectiveness in restoring gait patterns.',
      btnMoreDisable: false,
      btnDownloadDisable: false,
      downloadUrl: 'assets/PDFs/Publications/Thesis.pdf',
      downloadFileName: 'Thesis'
    }
  ];

  public openDialog(selection: string) {  
    this.dataService.setSelectedRecord(selection);  
    this.dialog.open(PublicationDetailComponent);
  }
}
