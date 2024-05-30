import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ISkills } from '@portfolio-v2/interfaces';

/** Skill page */
@Component({
  selector: 'portfolio-v2-skills',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './skills.component.html',
  styleUrl: './skills.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SkillsComponent {
  /** Skills */
  public readonly skills: ISkills = {
    heading: 'TECHNICAL SKILLS',
    intro: 'I\'ve worked with a wide variety of programming languages. Here are a few technologies I have been working on recently',
    languagesCol1: new Map<string, number>([
      ['C++', 70],
      ['CSS', 40],
      ['Angular', 60],
    ]),
    languagesCol2: new Map<string, number>([
      ['JAVA', 50],
      ['HTML', 80],
      ['C#', 65],
    ]),
    toolHeading: 'MOST FREQUENTLY USED TOOLS',
    pointImageSrc: '../../../assets/images/skills/black-list-shape.svg',
    leftSubHeading: 'FRAMEWORKS AND ENGINES',
    framework: ['Unity Engine', 'MRTK', 'Bootstrap', 'AWS', 'STL'],
    rightSubHeading: 'SOFTWARE',
    software: ['Windows(10) & Linux(Ubuntu)', 'Git & Subversion', 'Doxygen', 'SQLite', 'Jira']
  }
}
