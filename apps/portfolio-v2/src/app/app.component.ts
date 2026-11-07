import {
  ChangeDetectionStrategy,
  Component,
} from '@angular/core';
import { MatIconRegistry } from '@angular/material/icon';
import { RouterOutlet } from '@angular/router';

import { NavBarComponent } from '@portfolio-v2/shared/components';

/** Main Component */
@Component({
  standalone: true,
  imports: [
    RouterOutlet,
    NavBarComponent,
  ],
  selector: 'portfolio-v2-root',
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './app.component.scss',
})
export class AppComponent {
  /** Page title */
  public readonly title = 'Pubudu Wijesooriya';

  /**
   * Use the subset icon font from the document head.
   * @param icons icon registry
   */
  constructor(icons: MatIconRegistry) {
    icons.setDefaultFontSetClass('material-symbols-outlined');
  }
}
