import {
  ComponentFixture,
  TestBed,
} from '@angular/core/testing';
import { provideMockStore } from '@ngrx/store/testing';
import { createSpyObj } from 'jest-createspyobj';

import { GetDateTimeService } from '@portfolio-v2/shared/services';
import { LandingBannerComponent } from './landing_banner.component';

const FALL_POSTER_MOBILE = 'https://firebasestorage.googleapis.com/v0/b/portfolio-c9b8e.firebasestorage.app/o/portfolio%2Flanding-page%2Fbanners%2Ffall%2FFall_Banner-poster-mobile.webp?alt=media';
const WINTER_POSTER_MOBILE = 'https://firebasestorage.googleapis.com/v0/b/portfolio-c9b8e.firebasestorage.app/o/portfolio%2Flanding-page%2Fbanners%2Fwinter%2FWinter_Banner-poster-mobile.webp?alt=media';

describe('LandingBannerComponent', () => {
  let fixture: ComponentFixture<LandingBannerComponent>;
  let mockDateTimeService: jest.Mocked<GetDateTimeService>;

  beforeEach(async () => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: (query: string) => ({
        matches: false,
        media: query,
      }),
    });
    mockDateTimeService = createSpyObj(GetDateTimeService);
    await TestBed.configureTestingModule({
      imports: [LandingBannerComponent],
      providers: [
        provideMockStore(),
        {
          provide: GetDateTimeService,
          useValue: mockDateTimeService,
        },
      ],
    }).compileComponents();
  });

  /**
   * Render the banner for one calendar month.
   * @param month Month number from 1 to 12.
   */
  function render(month: number): void {
    mockDateTimeService.getMonth.mockReturnValue(month);
    fixture = TestBed.createComponent(LandingBannerComponent);
    fixture.detectChanges();
  }

  describe('when the month is November', () => {
    beforeEach(() => {
      render(11);
    });

    it('should show the fall phone poster before any video bytes', () => {
      const image = fixture.nativeElement.querySelector<HTMLImageElement>('img');
      const video = fixture.nativeElement.querySelector<HTMLVideoElement>('video');

      expect(image?.getAttribute('src')).toBe(FALL_POSTER_MOBILE);
      expect(image?.getAttribute('fetchpriority')).toBe('high');
      expect(video?.hasAttribute('autoplay')).toBe(true);
      expect(video?.hasAttribute('muted')).toBe(true);
    });

    it('should offer the desktop still only at 768px and wider', () => {
      const source = fixture.nativeElement.querySelector<HTMLSourceElement>('source[type="image/webp"]');

      expect(source?.getAttribute('media')).toBe('(min-width: 768px)');
      expect(source?.getAttribute('srcset')).toContain('Fall_Banner-poster-desktop.webp');
    });

    it('should offer a phone mp4 after the wide sources', () => {
      const sources = [...fixture.nativeElement.querySelectorAll<HTMLSourceElement>('video source')];
      const phoneMp4 = sources.find((source) => source.getAttribute('type') === 'video/mp4' && !source.getAttribute('media'));

      expect(phoneMp4?.getAttribute('src')).toContain('Fall_Banner-mobile.mp4');
    });
  });

  describe('when the month is January', () => {
    it('should show the winter phone poster', () => {
      render(1);
      const image = fixture.nativeElement.querySelector<HTMLImageElement>('img');

      expect(image?.getAttribute('src')).toBe(WINTER_POSTER_MOBILE);
    });
  });
});
