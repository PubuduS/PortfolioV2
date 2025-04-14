import { Component } from '@angular/core';
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
  styleUrl: './app.component.scss',
})
export class AppComponent {
  /** Page title */
  public readonly title = 'Pubudu Wijesooriya';
}
