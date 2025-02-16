import {
  ChangeDetectionStrategy,
  Component,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';

import { ISkills } from '@portfolio-v2/interfaces';
import { GetDataService } from '@portfolio-v2/shared/services';

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
  /** Observable containing Skills section data */
  public readonly skillsData: Observable<ISkills>;

  /** Bullet point image src */
  protected readonly bulletPointImageSrc = 'assets/images/skills/black-list-shape.svg';

  /**
   * constructor
   * @param dataService database service
   */
  constructor(private dataService: GetDataService) {
    this.skillsData = this.dataService.getSkillsSectionData('skills-section');
  }
}
