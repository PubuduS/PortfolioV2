import {
  ChangeDetectionStrategy,
  Component,
} from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Party mode page
 */
@Component({
  selector: 'portfolio-v2-party-mode',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './party_mode.component.html',
  styleUrl: './party_mode.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PartyModeComponent {}
