import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  ViewChild,
} from '@angular/core';
import { Store } from '@ngrx/store';

import { GetDateTimeService } from '@portfolio-v2/shared/services';
import { StateActions } from '@portfolio-v2/state';
import {
  BannerMedia,
  bannerMediaForMonth,
} from './banner-media';

/** Landing page banner. The still paints first, then the video covers it. */
@Component({
  selector: 'portfolio-v2-landing-banner',
  standalone: true,
  imports: [],
  templateUrl: './landing_banner.component.html',
  styleUrl: './landing_banner.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LandingBannerComponent implements AfterViewInit {
  /** Poster and video URLs for the current season. */
  public readonly media: BannerMedia;

  /** True once the motion clip has painted a frame. */
  public motionVisible = false;

  /** Motion clip stacked on the still. */
  @ViewChild('motion')
  private motion?: ElementRef<HTMLVideoElement>;

  /**
   * constructor
   * @param dateTimeService date time service
   * @param store ngrx store
   */
  constructor(
    private dateTimeService: GetDateTimeService,
    private store: Store,
  ) {
    this.media = bannerMediaForMonth(this.dateTimeService.getMonth());
    this.populateStore();
  }

  /**
   * Start the clip after the sources exist.
   * @inheritdoc
   */
  public ngAfterViewInit(): void {
    this.playMotion();
  }

  /**
   * Hide the still once the clip is painting frames.
   */
  public showMotion(): void {
    this.motionVisible = true;
  }

  /**
   * Load the selected source and play it.
   * A cached poster does not fire a load event, so playback cannot wait on that event.
   */
  private playMotion(): void {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }
    const video = this.motion?.nativeElement;
    if (!video) {
      return;
    }
    video.load();
    video.play()?.catch(() => undefined);
  }

  /** Dispatch all the actions to populate data */
  private populateStore(): void {
    this.store.dispatch(StateActions.aboutMeStateConnect());
    this.store.dispatch(StateActions.skillsStateConnect());
    this.store.dispatch(StateActions.experienceStateConnect());
    this.store.dispatch(StateActions.portfolioCardsStateConnect());
    this.store.dispatch(StateActions.projectCardsStateConnect());
    this.store.dispatch(StateActions.featuredProjectCardsStateConnect());
    this.store.dispatch(StateActions.certificatesCardsStateConnect());
    this.store.dispatch(StateActions.educationCardsStateConnect());
    this.store.dispatch(StateActions.publicationCardsStateConnect());
    this.store.dispatch(StateActions.publicationDetailCardsStateConnect());
    this.store.dispatch(StateActions.socialMediaInformationStateConnect());
    this.store.dispatch(StateActions.adminStateConnect());
  }
}
