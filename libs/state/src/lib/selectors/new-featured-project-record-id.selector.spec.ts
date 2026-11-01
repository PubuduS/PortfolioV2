import { IProjectCard } from '../data-models';
import { StoreState } from '../state.state';
import { newFeaturedProjectRecordIdSelector } from './new-featured-project-record-id.selector';

/**
 * @param id card id
 * @returns a project card
 */
function projectCard(id: number): IProjectCard {
  return {
    id,
    heading: `Heading ${id}`,
    description: '',
    tools: '',
    imageURL: '',
  };
}

/**
 * @param partial slices under test
 * @returns a root state with the portfolio feature key
 */
function bank(partial: Partial<StoreState>): { stateBanks: StoreState } {
  return {
    stateBanks: {
      selectedProjectCardID: 0,
      selectedPublicationID: 0,
      isAdmin: false,
      isPreviewMode: false,
      isPartyMode: false,
      ...partial,
    },
  };
}

describe('newFeaturedProjectRecordIdSelector', () => {
  it('should be 2 before featured cards have loaded', () => {
    expect(newFeaturedProjectRecordIdSelector(bank({}))).toBe(2);
  });

  it('should be 2 when the featured list is empty', () => {
    expect(newFeaturedProjectRecordIdSelector(bank({ featuredProjectCards: [] }))).toBe(2);
  });

  it('should add one to the last featured card and ignore earlier ids', () => {
    expect(newFeaturedProjectRecordIdSelector(bank({
      featuredProjectCards: [projectCard(9), projectCard(4)],
    }))).toBe(5);
  });

  it('should ignore project cards that are not featured', () => {
    expect(newFeaturedProjectRecordIdSelector(bank({
      featuredProjectCards: [projectCard(4)],
      projectCards: [projectCard(20)],
    }))).toBe(5);
  });
});
