import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import {
  type FieldTree,
  FormField,
} from '@angular/forms/signals';

import { fieldHasError } from '@portfolio-v2/shared/forms';

/**
 * Description, links, and the screenshot field shared by the project-card editors.
 */
@Component({
  selector: 'admin-project-card-fields',
  standalone: true,
  imports: [
    FormField,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './project-card-fields.component.html',
  styleUrl: './project-card-fields.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectCardFieldsComponent {
  /** Featured cards ask for a heading. Other cards omit it. */
  public readonly heading = input<FieldTree<string> | null>(null);

  /** Description field. */
  public readonly description = input.required<FieldTree<string>>();

  /** Technologies field. */
  public readonly technologies = input.required<FieldTree<string>>();

  /** Codebase URL field. */
  public readonly codebase = input.required<FieldTree<string>>();

  /** YouTube URL field. */
  public readonly youtube = input.required<FieldTree<string>>();

  /** Screenshot URL field. */
  public readonly screenshot = input.required<FieldTree<string>>();

  /** Documentation URL field. */
  public readonly documentation = input.required<FieldTree<string>>();

  /** The page opens the screenshot dialog. */
  public readonly uploadScreenshot = output<void>();

  /** Whether a touched or dirty field currently has this error. */
  protected readonly hasError = fieldHasError;
}
