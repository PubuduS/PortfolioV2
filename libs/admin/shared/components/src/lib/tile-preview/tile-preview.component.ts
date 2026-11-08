import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';

/**
 * Current icon and the replacement the tile editors preview.
 */
@Component({
  selector: 'admin-tile-preview',
  standalone: true,
  templateUrl: './tile-preview.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TilePreviewComponent {
  /** Preview of the file the admin just chose. */
  public readonly previewSrc = input.required<string>();

  /** Icon already stored for this tile. */
  public readonly currentSrc = input.required<string>();

  /** The page reads the chosen file. */
  public readonly fileSelected = output<Event>();
}
