import { IEducation } from '../data-models';
import { StoreState } from '../state.state';
import {
  educationSelector,
  nextEducationIdSelector,
} from './education.selector';

/** A store with nothing loaded. */
const emptyState: StoreState = {
  selectedProjectCardID: 0,
  selectedPublicationID: 0,
  isAdmin: false,
  isPreviewMode: false,
  isPartyMode: false,
};

/**
 * @param id institute id
 * @returns a stored institute
 */
function institute(id: number): IEducation {
  return {
    id,
    title: `Institute ${id}`,
    period: '2020 - 2021',
    degree: 'Degree',
    gpa: '4.0',
    awards: 'Award',
    credits: '30/30',
    graduated: 'May 2021',
    extra: '',
  };
}

describe('education selectors', () => {
  describe('educationSelector', () => {
    it('should return the education records from the state', () => {
      const education = [institute(2), institute(1)];

      expect(educationSelector.projector({ ...emptyState, education })).toBe(education);
    });
  });

  describe('nextEducationIdSelector', () => {
    it('should be 1 before the collection has loaded', () => {
      expect(nextEducationIdSelector.projector(undefined)).toBe(1);
    });

    it('should be one past the largest id regardless of order', () => {
      expect(nextEducationIdSelector.projector([institute(5), institute(2)])).toBe(6);
    });
  });
});
