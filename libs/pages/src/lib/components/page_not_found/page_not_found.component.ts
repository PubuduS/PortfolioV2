import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import {
  Subscription,
  interval,
  tap,
} from 'rxjs';

import { quoteForLanding } from './page-not-found-quotes';

/** Page not found error page */
@Component({
  selector: 'portfolio-v2-page-not-found',
  standalone: true,
  templateUrl: './page_not_found.component.html',
  styleUrl: './page_not_found.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageNotFoundComponent implements OnInit, OnDestroy {
  /** Is left GIF visible */
  public isLeftGIFVisible = signal(true);

  /** Is right GIF visible */
  public isRightGIFVisible = signal(false);

  /** Words of the line chosen for this landing. */
  public quoteWords: string[] = [];

  /** Subscription */
  public sub!: Subscription;

  /** GIF visibility timer */
  private readonly visibilityTimer: number = 4000;

  /**
   * Swap the two missing-page animations on a timer.
   * @inheritdoc
   */
  public ngOnInit(): void {
    this.quoteWords = quoteForLanding(new Date()).split(' ');
    this.sub = interval(this.visibilityTimer)
      .pipe(
        tap(() => {
          this.isLeftGIFVisible.set(!this.isLeftGIFVisible());
          this.isRightGIFVisible.set(!this.isLeftGIFVisible());
          console.log(`left ${this.isLeftGIFVisible}: right ${this.isRightGIFVisible}`);
        }),
      ).subscribe();
    console.log(this.quoteWords);
  }

  /**
   * Stop the animation timer.
   * @inheritdoc
   */
  public ngOnDestroy(): void {
    if (this.sub) {
      this.sub.unsubscribe();
    }
  }
}
