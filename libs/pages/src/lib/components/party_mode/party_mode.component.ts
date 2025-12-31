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
  templateUrl: './party_mode.component.html',
  styleUrl: './party_mode.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PartyModeComponent {}
