import {
  createVersionId,
  storageObjectPath,
} from '@portfolio-v2/state/dataModels';
import { MAX_BASELINE_FILE_BYTES } from './constants';
import {
  assertNoResidualPii,
  assertWithinBaselineLimit,
  placeholderFor,
  sanitizeDocuments,
  sanitizeString,
  storageReplacement,
} from './sanitize';
import { type BaselineDocument } from './typed-json';

function textDoc(id: string, fields: Record<string, string>): BaselineDocument {
  const encoded: Record<string, { type: 'string'; value: string }> = {};
  Object.entries(fields).forEach(([key, value]) => {
    encoded[key] = { type: 'string', value };
  });
  return {
    id,
    data: { type: 'map', fields: encoded },
  };
}

function stringField(document: BaselineDocument | undefined, field: string): string {
  if (!document || document.data.type !== 'map') {
    throw new Error('missing document');
  }
  const value = document.data.fields[field];
  if (!value || value.type !== 'string') {
    throw new Error(`missing string ${field}`);
  }
  return value.value;
}

describe('sanitizer', () => {
  describe('when a string holds contact data or a token', () => {
    it('should replace an email address', () => {
      const sanitized = sanitizeDocuments('social-infor-section', [
        textDoc('mail', { media: 'person.name@gmail.com' }),
      ]);
      expect(stringField(sanitized[0], 'media')).toBe('mock.user@example.test');
    });

    it('should replace a phone number', () => {
      const sanitized = sanitizeString('experience-section', 'points.0', 'Call (415) 555-2671 today');
      expect(sanitized).toBe('Call +1-555-0100 today');
    });

    it('should replace a token', () => {
      const sanitized = sanitizeString('about-me-section', 'link', 'https://cdn.example/file?token=abcDEF123456');
      expect(sanitized).toBe('https://cdn.example/file?token=mock-token');
    });

    it('should rewrite a live storage url and drop its token', () => {
      const raw = [
        'https://firebasestorage.googleapis.com/v0/b/portfolio-c9b8e.firebasestorage.app/o/',
        'portfolio%2Fabout-me-section%2Fprofile%2FMyPhoto.webp?alt=media&token=abcDEF123456',
      ].join('');
      const sanitized = sanitizeString('about-me-section', 'imageSrc', raw);
      expect(sanitized).toBe('storage://portfolio/about-me-section/profile/MyPhoto.webp');
    });
  });

  describe('when personal data is still present', () => {
    it('should fail closed', () => {
      const dirty = {
        'social-infor-section': [textDoc('mail', { media: 'person.name@gmail.com' })],
      };
      expect(() => assertNoResidualPii(dirty)).toThrow(/social-infor-section\/mail/);
    });

    it('should accept the mocked value', () => {
      const clean = sanitizeDocuments('social-infor-section', [
        textDoc('mail', {
          media: 'mailto:person.name@gmail.com',
        }),
      ]);
      expect(() => assertNoResidualPii({ 'social-infor-section': clean })).not.toThrow();
      expect(stringField(clean[0], 'media')).toBe('mailto:mock.user@example.test');
    });

    it('should reject a leftover live storage host', () => {
      const dirty = {
        'about-me-section': [textDoc('part-01', {
          imageSrc: 'https://firebasestorage.googleapis.com/v0/b/other/o/x',
        })],
      };
      expect(() => assertNoResidualPii(dirty)).toThrow(/about-me-section\/part-01/);
    });

    it('should ignore the storage host when it is only a path on another origin', () => {
      const otherOrigin = {
        'about-me-section': [textDoc('part-01', {
          link: 'https://example.com/docs/firebasestorage.googleapis.com',
        })],
      };
      expect(() => assertNoResidualPii(otherOrigin)).not.toThrow();
    });
  });

  describe('when a storage object is large or personal', () => {
    it('should replace banner media, the profile photo, and a resume', () => {
      const banner = storageReplacement('portfolio/landing-page/banners/fall/hero.gif');
      const photo = storageReplacement('portfolio/about-me-section/profile/MyPhoto.webp');
      const resume = storageReplacement('portfolio/about-me-section/files/Resume.pdf');
      expect(banner?.replacement).toBe('gif');
      expect(photo?.replacement).toBe('webp');
      expect(resume?.replacement).toBe('resume');
      if (!banner || !photo) {
        throw new Error('expected storage rules');
      }
      const gif = placeholderFor(banner);
      const photoBytes = placeholderFor(photo);
      expect(gif.bytes.subarray(0, 3).toString('ascii')).toBe('GIF');
      expect(gif.bytes.length).toBeGreaterThan(10_000);
      const still = storageReplacement('portfolio/landing-page/banners/fall/Fall_Banner-poster-mobile.webp');
      const clip = storageReplacement('portfolio/landing-page/banners/winter/Winter_Banner-mobile.mp4');
      const wide = storageReplacement('portfolio/landing-page/banners/spring/Spring_Banner-desktop.webm');
      expect(still?.replacement).toBe('banner-webp');
      expect(clip?.replacement).toBe('banner-mp4');
      expect(wide?.replacement).toBe('banner-webm');
      if (!still || !clip || !wide) {
        throw new Error('expected banner media rules');
      }
      const webp = placeholderFor(still);
      const mp4 = placeholderFor(clip);
      const webm = placeholderFor(wide);
      expect(webp.contentType).toBe('image/webp');
      expect(webp.bytes.subarray(0, 4).toString('ascii')).toBe('RIFF');
      expect(webp.bytes.subarray(8, 12).toString('ascii')).toBe('WEBP');
      expect(mp4.contentType).toBe('video/mp4');
      expect(mp4.bytes.subarray(4, 8).toString('ascii')).toBe('ftyp');
      expect(webm.contentType).toBe('video/webm');
      expect(Array.from(webm.bytes.subarray(0, 4))).toEqual([0x1a, 0x45, 0xdf, 0xa3]);
      expect(photoBytes.contentType).toBe('image/png');
      expect(Array.from(photoBytes.bytes.subarray(0, 8))).toEqual(
        [137, 80, 78, 71, 13, 10, 26, 10]
      );
      expect(photoBytes.bytes.length).toBeGreaterThan(1000);
    });

    it('should replace publication papers and other pdfs with a small pdf', () => {
      const livePaper = storageReplacement('portfolio/publications/papers/ID-01-Paper.pdf');
      const cover = storageReplacement('portfolio/publications/publication-card-images/ID-01-Image.webp');
      const otherPdf = storageReplacement('portfolio/certificates/cert-01.pdf');
      expect(livePaper?.replacement).toBe('pdf');
      expect(cover).toBeNull();
      expect(otherPdf?.replacement).toBe('pdf');
      if (!livePaper) {
        throw new Error('expected paper rule');
      }
      const placeholder = placeholderFor(livePaper);
      expect(placeholder.contentType).toBe('application/pdf');
      expect(placeholder.bytes.subarray(0, 8).toString('ascii')).toBe('%PDF-1.1');
    });

    it('should replace a catalog resume and leave a cover letter', () => {
      const id = createVersionId(1730000000000, 1);
      const resume = storageReplacement(storageObjectPath('resume', id));
      const letter = storageReplacement(storageObjectPath('cover-letter', id));
      expect(resume?.replacement).toBe('resume');
      expect(letter).toBeNull();
    });

    it('should refuse a file over 1 MiB', () => {
      expect(() => assertWithinBaselineLimit(MAX_BASELINE_FILE_BYTES + 1, 'too-big.webp')).toThrow(/1 MiB/);
    });
  });
});
