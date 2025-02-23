import {
  ChangeDetectionStrategy,
  Component,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';

import { ICertificateCard } from '@portfolio-v2/interfaces';
import { GetDataService } from '@portfolio-v2/shared/services';

/**
 * Certifications Page
 */
@Component({
  selector: 'portfolio-v2-certifications',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './certifications.component.html',
  styleUrl: './certifications.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CertificationsComponent {
  /** Certificates Icon URL */
  public readonly certificate_icon_URL: string = 'assets/images/certificate_Icon/certificate.png';
  /** Tooltip string */
  public readonly tooltip: string = 'Click here to view the certificate';
  /** Observable of ICertificateCard array */
  protected certificatesCards$: Observable<ICertificateCard[]>;

  /**
   * constructor
   * @param dataService data service
   */
  constructor(private dataService: GetDataService) {
    this.certificatesCards$ = this.dataService.getCertificatesInformation('certification-section');
  }
}
