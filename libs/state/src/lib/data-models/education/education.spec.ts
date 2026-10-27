import { IEducation } from './IEducation';
import {
  EducationFormValues,
  educationDocPath,
  nextEducationId,
  toEducationDraft,
} from './education';

/** Values for a complete record. */
const complete: EducationFormValues = {
  title: 'South Dakota State University',
  period: '2016 - 2019',
  degree: 'BACHELOR OF SCIENCE (BSc) IN COMPUTER SCIENCE',
  gpa: '3.537',
  awards: 'Spring 2019',
  credits: '149/120',
  graduated: '04th of May 2019',
  extra: 'Summa cum laude',
};

describe('education model', () => {
  describe('educationDocPath', () => {
    it.each([
      [1, 'education-section/institute-01'],
      [3, 'education-section/institute-03'],
      [12, 'education-section/institute-12'],
      [123, 'education-section/institute-123'],
    ])('should map id %i to %s', (id, expected) => {
      expect(educationDocPath(id)).toBe(expected);
    });
  });

  describe('nextEducationId', () => {
    it('should start at 1 when nothing has loaded', () => {
      expect(nextEducationId(undefined)).toBe(1);
    });

    it('should start at 1 when the collection is empty', () => {
      expect(nextEducationId([])).toBe(1);
    });

    it('should take one past the largest id even when ids have gaps', () => {
      expect(nextEducationId([{ id: 5 }, { id: 2 }, { id: 3 }])).toBe(6);
    });

    it('should ignore ids that are not positive integers', () => {
      expect(nextEducationId([{ id: 0 }, { id: -3 }, { id: 1.5 }, { id: 3 }])).toBe(4);
    });
  });

  describe('toEducationDraft', () => {
    it('should build the stored record', () => {
      expect(toEducationDraft(4, complete)).toEqual({
        ok: true,
        education: { id: 4, ...complete } satisfies IEducation,
      });
    });

    it('should trim every text field', () => {
      const result = toEducationDraft(1, {
        title: '  Padded  ',
        period: ' 2020 - 2021 ',
        degree: ' Degree ',
        gpa: ' 4.0 ',
        awards: ' Award ',
        credits: ' 30/30 ',
        graduated: ' May 2021 ',
        extra: ' Honors ',
      });

      expect(result).toEqual({
        ok: true,
        education: {
          id: 1,
          title: 'Padded',
          period: '2020 - 2021',
          degree: 'Degree',
          gpa: '4.0',
          awards: 'Award',
          credits: '30/30',
          graduated: 'May 2021',
          extra: 'Honors',
        },
      });
    });

    it('should store an empty string when the extra is blank', () => {
      expect(toEducationDraft(1, { ...complete, extra: '   ' })).toMatchObject({
        ok: true,
        education: { extra: '' },
      });
    });

    describe('when a rule fails', () => {
      it.each([0, -1, 1.5, Number.NaN])('should reject id %p', (id) => {
        expect(toEducationDraft(id, complete)).toEqual({ ok: false, reason: 'invalid-id' });
      });

      it.each(['title', 'period', 'degree', 'gpa', 'awards', 'credits', 'graduated'] as const)(
        'should reject a blank %s',
        (field) => {
          expect(toEducationDraft(1, { ...complete, [field]: '  ' })).toEqual({
            ok: false,
            reason: 'missing-field',
          });
        },
      );
    });
  });
});
