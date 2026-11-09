import { HighlightPipe } from './highlight-pipe.pipe';

describe('HighlightPipe', () => {
  const pipe = new HighlightPipe();

  describe('when the text is empty', () => {
    it.each(['', null, undefined])('should return an empty string for %p', (value) => {
      expect(pipe.transform(value as string)).toBe('');
    });
  });

  describe('when the text has no brackets', () => {
    it('should return the text unchanged', () => {
      expect(pipe.transform('Angular and Nx')).toBe('Angular and Nx');
    });
  });

  describe('when brackets mark a technology', () => {
    it('should wrap each marked span', () => {
      expect(pipe.transform('Use [Angular] with [Nx].')).toBe(
        'Use <span class="highlight-tech">Angular</span> with <span class="highlight-tech">Nx</span>.',
      );
    });

    it('should leave an unclosed bracket as plain text', () => {
      expect(pipe.transform('Use [Angular')).toBe('Use [Angular');
    });
  });
});
