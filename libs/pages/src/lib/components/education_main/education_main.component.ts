import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
} from '@angular/core';
import { Router } from '@angular/router';

import { FlowerAnimationComponent } from './components/flower/flower-animation.component';
import { loadFlowerScripts } from './flower-scripts';

/** function declaration for flower animation */
declare function FlowerAnimation(): void;

/** Education main page */
@Component({
  selector: 'portfolio-v2-education-main',
  standalone: true,
  imports: [
    FlowerAnimationComponent,
  ],
  templateUrl: './education_main.component.html',
  styleUrl: './education_main.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EducationMainComponent implements AfterViewInit, OnDestroy {
  /** False after the page is destroyed, so a late script cannot start the timeline. */
  private isActive = true;

  /**
   * Create the hub.
   * @param router router
   */
  constructor(private router: Router) {}

  /**
   * Load the flower scripts after the drawings are in the page.
   * @inheritdoc
   */
  public ngAfterViewInit(): void {
    this.startFlowerAnimation();
  }

  /**
   * Ignore a script that finishes after the visitor has left.
   * @inheritdoc
   */
  public ngOnDestroy(): void {
    this.isActive = false;
  }

  /**
   * Certifications tile target for the mode on screen.
   * @returns Admin or public certificates path.
   */
  protected get certificatesPath(): string {
    return `${this.sectionRoot()}/education/certificates`;
  }

  /**
   * Education tile target for the mode on screen.
   * @returns Admin or public degrees path.
   */
  protected get degreesPath(): string {
    return `${this.sectionRoot()}/education/degrees`;
  }

  /**
   * Publications tile target for the mode on screen.
   * @returns Admin or public publications path.
   */
  protected get publicationsPath(): string {
    return `${this.sectionRoot()}/education/publications`;
  }

  /**
   * Admin mode stays under `/admin`. Preview and the public site stay under `/content`.
   * @returns Route root for the hub that is open.
   */
  private sectionRoot(): string {
    return this.router.url.startsWith('/admin') ? 'admin' : 'content';
  }

  /**
   * Start the timeline once TweenMax, TimelineMax, and flower.js are loaded.
   */
  private startFlowerAnimation(): void {
    loadFlowerScripts()
      .then(() => {
        if (this.isActive) {
          FlowerAnimation();
        }
      })
      .catch(() => undefined);
  }
}
