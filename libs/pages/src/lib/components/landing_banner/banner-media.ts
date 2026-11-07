/** Public bucket that holds the seasonal banner files. */
export const BANNER_STORAGE_BUCKET = 'portfolio-c9b8e.firebasestorage.app';

/** Viewport width where the desktop poster and video replace the mobile files. */
export const BANNER_DESKTOP_MIN_WIDTH = '(min-width: 768px)';

/** One seasonal illustration, already split for phones and wider screens. */
export interface BannerMedia {
  /** Still shown before the video, at 1200 by 800. */
  posterMobile: string;
  /** Still shown before the video, at 1920 by 1280. */
  posterDesktop: string;
  /** Phone-width VP9 clip. */
  mobileWebm: string;
  /** Phone-width H.264 clip for Safari. */
  mobileMp4: string;
  /** Desktop VP9 clip. */
  desktopWebm: string;
  /** Desktop H.264 clip for Safari. */
  desktopMp4: string;
}

/** Season chosen from a calendar month numbered 1 through 12. */
export type BannerSeason = 'fall' | 'spring' | 'winter';

/** Map a banner season to the file prefix. */
const SEASON_FILE_PREFIX: Record<BannerSeason, string> = {
  fall: 'Fall',
  spring: 'Spring',
  winter: 'Winter',
};

/**
 * Map a calendar month to the banner season.
 * `index.html` copies this rule so the poster preloads before the bundle.
 * @param month Month number from 1 to 12.
 * @returns The season whose files should load.
 */
export function seasonForMonth(month: number): BannerSeason {
  if (month <= 3 || month === 12) {
    return 'winter';
  }
  if (month <= 8) {
    return 'spring';
  }
  return 'fall';
}

/**
 * Build a public Storage URL for one object.
 * @param bucket Storage bucket name.
 * @param objectPath Path inside the bucket.
 * @returns URL that can be used as an image or video source.
 */
export function storageMediaUrl(bucket: string, objectPath: string): string {
  const encodedPath = encodeURIComponent(objectPath);
  return `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodedPath}?alt=media`;
}

/**
 * Resolve the poster and video URLs for a month.
 * @param month Month number from 1 to 12.
 * @param bucket Storage bucket. Defaults to the public portfolio bucket.
 * @returns Sources for the current season.
 */
export function bannerMediaForMonth(
  month: number,
  bucket: string = BANNER_STORAGE_BUCKET,
): BannerMedia {
  const season = seasonForMonth(month);
  const prefix = SEASON_FILE_PREFIX[season];
  const folder = `portfolio/landing-page/banners/${season}`;
  const file = (suffix: string): string => storageMediaUrl(bucket, `${folder}/${prefix}_Banner-${suffix}`);
  return {
    desktopMp4: file('desktop.mp4'),
    desktopWebm: file('desktop.webm'),
    mobileMp4: file('mobile.mp4'),
    mobileWebm: file('mobile.webm'),
    posterDesktop: file('poster-desktop.webp'),
    posterMobile: file('poster-mobile.webp'),
  };
}
