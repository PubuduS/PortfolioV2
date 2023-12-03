import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'portfolio-v2-landing-banner',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './landing_banner.component.html',
  styleUrl: './landing_banner.component.css',
})
export class LandingBannerComponent implements OnInit {
  bannerImageSrc: string = "assets/images/banners/Spring_Banner.gif";

  ngOnInit(): void 
  {
    this.getSeasonalBanner();
  }
  
  getSeasonalBanner(): string
  {
    // eslint-disable-next-line prefer-const
    let month: number = 9;

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

    return this.bannerImageSrc;
  }

}
