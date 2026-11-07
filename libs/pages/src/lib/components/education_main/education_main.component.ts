import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
} from '@angular/core';

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
