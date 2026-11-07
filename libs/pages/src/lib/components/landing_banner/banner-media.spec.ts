import {
  bannerMediaForMonth,
  seasonForMonth,
} from './banner-media';

const FALL_POSTER_MOBILE = 'https://firebasestorage.googleapis.com/v0/b/portfolio-c9b8e.firebasestorage.app/o/portfolio%2Flanding-page%2Fbanners%2Ffall%2FFall_Banner-poster-mobile.webp?alt=media';
const FALL_POSTER_DESKTOP = 'https://firebasestorage.googleapis.com/v0/b/portfolio-c9b8e.firebasestorage.app/o/portfolio%2Flanding-page%2Fbanners%2Ffall%2FFall_Banner-poster-desktop.webp?alt=media';
const WINTER_MOBILE_MP4 = 'https://firebasestorage.googleapis.com/v0/b/portfolio-c9b8e.firebasestorage.app/o/portfolio%2Flanding-page%2Fbanners%2Fwinter%2FWinter_Banner-mobile.mp4?alt=media';
const SPRING_DESKTOP_WEBM = 'https://firebasestorage.googleapis.com/v0/b/portfolio-c9b8e.firebasestorage.app/o/portfolio%2Flanding-page%2Fbanners%2Fspring%2FSpring_Banner-desktop.webm?alt=media';

describe('seasonForMonth', () => {
  it.each([
    [1, 'winter'],
    [3, 'winter'],
    [12, 'winter'],
    [4, 'spring'],
    [8, 'spring'],
    [9, 'fall'],
    [11, 'fall'],
  ])('should map month %s to %s', (month, season) => {
    expect(seasonForMonth(month)).toBe(season);
  });
});

describe('bannerMediaForMonth', () => {
  describe('when the month is November', () => {
    it('should point the phone poster at the fall mobile still', () => {
      expect(bannerMediaForMonth(11).posterMobile).toBe(FALL_POSTER_MOBILE);
    });

    it('should point the wide poster at the fall desktop still', () => {
      expect(bannerMediaForMonth(11).posterDesktop).toBe(FALL_POSTER_DESKTOP);
    });
  });

  describe('when the month is January', () => {
    it('should point Safari on a phone at the winter mobile mp4', () => {
      expect(bannerMediaForMonth(1).mobileMp4).toBe(WINTER_MOBILE_MP4);
    });
  });

  describe('when the month is April', () => {
    it('should point a wide browser at the spring desktop webm', () => {
      expect(bannerMediaForMonth(4).desktopWebm).toBe(SPRING_DESKTOP_WEBM);
    });
  });
});
