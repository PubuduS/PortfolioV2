import {
  ChangeDetectionStrategy,
  Component,
} from '@angular/core';

/**
 * Party mode page
 */
@Component({
  selector: 'portfolio-v2-party-mode',
  standalone: true,
  templateUrl: './party-mode.component.html',
  styleUrl: './party-mode.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PartyModeComponent {}
