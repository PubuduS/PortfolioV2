import {
  ChangeDetectionStrategy,
  Component,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';

import { skillsSelector } from '@portfolio-v2/state/selectors';

/** Skill page */
@Component({
  selector: 'portfolio-v2-skills',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './skills.component.html',
  styleUrl: './skills.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SkillsComponent {
  /** Signal containing Skills section data */
  public readonly skillsData = this.store.selectSignal(skillsSelector);

  /** Bullet point image src */
  protected readonly bulletPointImageSrc = 'assets/images/skills/black-list-shape.svg';

  /**
   * constructor
   * @param store ngrx store
   */
  constructor(private store: Store) {}
}
