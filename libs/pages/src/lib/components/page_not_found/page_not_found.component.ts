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

  /** Subscription */
  public sub!: Subscription;

  /** Quote array */
  private readonly quotesArray: string[] = [
    "99 bugs in my code, 99 bugs in my code... Take one down, fix em' around, 404 bugs in my code",
    'Error 404. Your Haiku could not be found',
    "Webpages? Where we're going, we don't need webpages",
    "The page you're looking for is on a coffee break. It needs its caffeine fix to get back online.",
    'How do we know we exist?',
  ];

  /** Random quote index */
  private readonly qIndex: number = Math.floor(Math.random() * this.quotesArray.length);

  /** Random quote */
  public randomQuote: string[] = this.quotesArray[this.qIndex].split(' ');

  /** GIF visibility timer */
  private readonly visibilityTimer: number = 4000;

  /**
   * @inheritdoc
   */
  public ngOnInit(): void {
    this.sub = interval(this.visibilityTimer)
      .pipe(
        tap(() => {
          this.isLeftGIFVisible.set(!this.isLeftGIFVisible());
          this.isRightGIFVisible.set(!this.isLeftGIFVisible());
          console.log(`left ${this.isLeftGIFVisible}: right ${this.isRightGIFVisible}`);
        }),
      ).subscribe();
    console.log(this.randomQuote);
  }

  /** @inheritdoc */
  public ngOnDestroy(): void {
    if (this.sub) {
      this.sub.unsubscribe();
    }
  }
}
