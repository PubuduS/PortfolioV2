import {
  ChangeDetectionStrategy,
  Component,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';

import { IAboutMe } from '@portfolio-v2/interfaces';
import { GetDataService } from '@portfolio-v2/shared/services';

/**
 * About me page
 */
@Component({
  selector: 'portfolio-v2-about-me',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './about_me.component.html',
  styleUrl: './about_me.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AboutMeComponent {
  /** Observable containing About Me section data */
  public readonly aboutMeData: Observable<IAboutMe>;

  /**
   * constructor
   * @param dataService Satabase service
   */
  constructor(private dataService: GetDataService) {
    this.aboutMeData = this.dataService.getAboutMeSectionData('about-me-section');
  }

  /**
   * Remove the link tag and returns the string without that
   * @param line Line
   * @returns Formatted string
   */
  protected removeLinkTag(line: string): string {
    return line.slice(0, -8);
  }

  /**
   * Check to see the link tag
   * @param line Line
   * @returns True if link tag is detected; false otherwise
   */
  protected isLinkDetected(line: string): boolean {
    return line.endsWith('<<link>>');
  }
}
