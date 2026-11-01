import { UtilityService } from './utility.service';

describe('UtilityService', () => {
  const service = new UtilityService();

  describe('breakStringToParagraphs', () => {
    it('should split on newlines and drop blank lines', () => {
      expect(service.breakStringToParagraphs('Hello\n\nWorld\n')).toEqual(['Hello', 'World']);
    });

    it('should return no paragraphs for an empty string', () => {
      expect(service.breakStringToParagraphs('')).toEqual([]);
    });
  });

  describe('seperateSentences', () => {
    it('should return an empty string when there are no paragraphs', () => {
      expect(service.seperateSentences(undefined)).toBe('');
      expect(service.seperateSentences([])).toBe('');
    });

    it('should join paragraphs with a blank line and no trailing newline', () => {
      expect(service.seperateSentences(['Hello', 'World'])).toBe('Hello\n\nWorld');
    });
  });

  describe('getPaddedDigits', () => {
    it('should pad with zeros to the requested width', () => {
      expect(service.getPaddedDigits(3, 2)).toBe('03');
    });

    it('should pad with the given character', () => {
      expect(service.getPaddedDigits(3, 4, '*')).toBe('***3');
    });

    it('should leave a number that is already wide enough', () => {
      expect(service.getPaddedDigits(42, 2)).toBe('42');
    });
  });
});
