import {
  isFirebaseUrl,
  isWebUrl,
} from './url-validator';

describe('isWebUrl', () => {
  describe('when the value is an http or https URL with a dotted host', () => {
    it.each([
      'https://example.com',
      'http://example.com/docs',
      'https://cdn.example.com/a/b?q=1&x=2#section',
    ])('should accept %s', (value) => {
      expect(isWebUrl(value)).toBe(true);
    });
  });

  describe('when the value is not that kind of URL', () => {
    it.each([
      '',
      'example.com',
      'ftp://example.com',
      'https://localhost',
      'https://example.com ',
    ])('should reject %s', (value) => {
      expect(isWebUrl(value)).toBe(false);
    });
  });
});

describe('isFirebaseUrl', () => {
  describe('when the value is any http or https URL', () => {
    it.each([
      'https://localhost',
      'https://firebasestorage.googleapis.com/v0/b/app/o/photo.webp?alt=media&token=abc',
    ])('should accept %s', (value) => {
      expect(isFirebaseUrl(value)).toBe(true);
    });
  });

  describe('when the value has no http scheme', () => {
    it.each(['', 'example.com', 'ftp://example.com'])('should reject %s', (value) => {
      expect(isFirebaseUrl(value)).toBe(false);
    });
  });
});
