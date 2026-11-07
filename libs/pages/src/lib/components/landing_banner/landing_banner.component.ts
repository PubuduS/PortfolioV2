import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  ViewChild,
} from '@angular/core';

import { GetDateTimeService } from '@portfolio-v2/shared/services';
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

  /** Still that paints before the clip is requested. */
  @ViewChild('poster')
  private poster?: ElementRef<HTMLImageElement>;

  /** Motion clip stacked on the still. */
  @ViewChild('motion')
  private motion?: ElementRef<HTMLVideoElement>;

  /** True after the clip download has been started. */
  private hasStartedMotion = false;

  /**
   * constructor
   * @param dateTimeService date time service
   */
  constructor(
    private dateTimeService: GetDateTimeService,
  ) {
    this.media = bannerMediaForMonth(this.dateTimeService.getMonth());
  }

  /**
   * Start the clip once a cached still is already on screen.
   * @inheritdoc
   */
  public ngAfterViewInit(): void {
    this.playMotionAfterPoster();
  }

  /**
   * Hide the still once the clip is painting frames.
   */
  public showMotion(): void {
    this.motionVisible = true;
  }

  /**
   * Start the clip after the still has loaded.
   * A cached poster is already complete and does not fire a load event.
   */
  public playMotionAfterPoster(): void {
    if (this.hasStartedMotion || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }
    const poster = this.poster?.nativeElement;
    if (!poster?.complete) {
      return;
    }
    this.hasStartedMotion = true;
    this.playMotion();
  }

  /**
   * Load the selected source and play it.
   */
  private playMotion(): void {
    const video = this.motion?.nativeElement;
    if (!video) {
      return;
    }
    video.load();
    video.play()?.catch(() => undefined);
  }
}
