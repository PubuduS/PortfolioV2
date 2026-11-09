import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';

/**
 * One portfolio tile: image, heading, and description.
 * Admin chrome is projected in front of the image link.
 */
@Component({
  selector: 'portfolio-v2-project-tile',
  standalone: true,
  imports: [MatButtonModule],
  templateUrl: './project-tile.component.html',
  styleUrl: './project-tile.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectTileComponent {
  /** Tile image. */
  public readonly imageUrl = input.required<string>();

  /** Tile heading. */
  public readonly heading = input.required<string>();

  /** Tile description. */
  public readonly description = input.required<string>();

  /** Tooltip on the image. */
  public readonly tooltip = input('');

  /** The image button was clicked. */
  public readonly imageClick = output<void>();
}
