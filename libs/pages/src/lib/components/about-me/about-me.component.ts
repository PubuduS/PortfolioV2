import {
  ChangeDetectionStrategy,
  Component,
} from '@angular/core';
import { Store } from '@ngrx/store';

import { StateActions } from '@portfolio-v2/state';
import { aboutMeSelector } from '@portfolio-v2/state/selectors';

/**
 * About me page
 */
@Component({
  selector: 'portfolio-v2-about-me',
  standalone: true,
  templateUrl: './about-me.component.html',
  styleUrl: './about-me.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AboutMeComponent {
  /** Signal containing About Me section data */
  public readonly aboutMeData = this.store.selectSignal(aboutMeSelector);

  /**
   * constructor
   * @param store ngrx store
   */
  constructor(
    private store: Store,
  ) {
    this.store.dispatch(StateActions.aboutMeStateConnect());
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
