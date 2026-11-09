import {
  ChangeDetectionStrategy,
  Component,
  input,
} from '@angular/core';

/**
 * One featured-project icon.
 * A disabled icon is a span, so the link is not clickable.
 */
@Component({
  selector: 'portfolio-v2-project-link-icon',
  standalone: true,
  templateUrl: './project-link-icon.component.html',
  styleUrl: './project-link-icon.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectLinkIconComponent {
  /** True when the link must not be followed. */
  public readonly disabled = input<boolean | undefined>(false);

  /** Destination when the icon is enabled. */
  public readonly href = input<string | undefined>('');

  /** Icon image. */
  public readonly icon = input.required<string>();

  /** Image alt text. */
  public readonly alt = input.required<string>();

  /** Image tooltip. */
  public readonly tooltip = input('');
}
