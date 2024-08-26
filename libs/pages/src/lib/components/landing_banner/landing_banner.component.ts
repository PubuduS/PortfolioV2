import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GetDateTimeService } from '@portfolio-v2/services';

/** Landing page */
@Component({
  selector: 'portfolio-v2-landing-banner',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './landing_banner.component.html',
  styleUrl: './landing_banner.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LandingBannerComponent implements OnInit {

  /** Banner image */
  public bannerImageSrc = "assets/images/banners/Spring_Banner.gif";

  /** Date Time Service */
  private dateTimeService = inject(GetDateTimeService);

  /**
   * @inheritdoc
   */
  ngOnInit(): void
  {
    this.getSeasonalBanner();
  }

  /** Get the correct banner according to the season of the year */
  private getSeasonalBanner(): void
  {

    const month: number = this.dateTimeService.getMonth();

    if( month <= 3 || month === 12 )
    {
      this.bannerImageSrc = "assets/images/banners/Winter_Banner.gif";
    }
    else if( month > 3 && month <= 8 )
    {
      this.bannerImageSrc = "assets/images/banners/Spring_Banner.gif";
    }
    else
    {
      this.bannerImageSrc = "assets/images/banners/Fall_Banner.gif";
    }
  }

}
