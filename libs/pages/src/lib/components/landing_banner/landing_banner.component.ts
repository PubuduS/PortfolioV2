import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';

import { GetDateTimeService } from '@portfolio-v2/shared/services';
import { StateActions } from '@portfolio-v2/state';

/** Landing page */
@Component({
  selector: 'portfolio-v2-landing-banner',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './landing_banner.component.html',
  styleUrl: './landing_banner.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LandingBannerComponent implements OnInit {
  /** Banner image */
  public bannerImageSrc = 'assets/images/banners/Spring_Banner.gif';

  /** Date Time Service */
  private dateTimeService = inject(GetDateTimeService);

  /**
   * constructor
   * @param store ngrx store
   */
  constructor(private store: Store) {
    this.populateStore();
  }

  /**
   * @inheritdoc
   */
  public ngOnInit(): void {
    this.getSeasonalBanner();
  }

  /** Get the correct banner according to the season of the year */
  private getSeasonalBanner(): void {
    const month: number = this.dateTimeService.getMonth();

    if (month <= 3 || month === 12) {
      this.bannerImageSrc = 'assets/images/banners/Winter_Banner.gif';
    } else if (month > 3 && month <= 8) {
      this.bannerImageSrc = 'assets/images/banners/Spring_Banner.gif';
    } else {
      this.bannerImageSrc = 'assets/images/banners/Fall_Banner.gif';
    }
  }

  /** Dispatch all the actions to populate data */
  private populateStore(): void {
    this.store.dispatch(StateActions.aboutMeStateConnect());
    this.store.dispatch(StateActions.skillsStateConnect());
    this.store.dispatch(StateActions.experienceStateConnect());
    this.store.dispatch(StateActions.portfolioCardsStateConnect());
    this.store.dispatch(StateActions.projectCardsStateConnect());
    this.store.dispatch(StateActions.certificatesCardsStateConnect());
    this.store.dispatch(StateActions.educationCardsStateConnect());
    this.store.dispatch(StateActions.publicationCardsStateConnect());
    this.store.dispatch(StateActions.publicationDetailCardsStateConnect());
    this.store.dispatch(StateActions.socialMediaInformationStateConnect());
  }
}
