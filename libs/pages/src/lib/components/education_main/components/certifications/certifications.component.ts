import {
  ChangeDetectionStrategy,
  Component,
} from '@angular/core';
import { Store } from '@ngrx/store';

import { certificatesSelector } from '@portfolio-v2/state/selectors';

/**
 * Certifications Page
 */
@Component({
  selector: 'portfolio-v2-certifications',
  standalone: true,
  imports: [],
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
  protected certificatesCards = this.store.selectSignal(certificatesSelector);

  /**
   * constructor
   * @param store ngrx store
   */
  constructor(private store: Store) {}
}
