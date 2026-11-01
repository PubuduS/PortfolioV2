import { IProjectCard } from '../data-models';
import { StoreState } from '../state.state';
import { featuredProjectCardSelector } from './featured-project-card.selector';

/**
 * @param id card id
 * @param heading heading that identifies which slice the card came from
 * @returns a project card
 */
function projectCard(id: number, heading: string): IProjectCard {
  return {
    id,
    heading,
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

describe('featuredProjectCardSelector', () => {
  const featured = [projectCard(1, 'One'), projectCard(2, 'Featured')];

  it('should return the featured card with that id', () => {
    expect(featuredProjectCardSelector(2)(bank({
      featuredProjectCards: featured,
    }))).toEqual(featured[1]);
  });

  it('should read featured cards rather than a project card with the same id', () => {
    expect(featuredProjectCardSelector(2)(bank({
      featuredProjectCards: featured,
      projectCards: [projectCard(2, 'Project')],
    }))).toEqual(projectCard(2, 'Featured'));
  });

  it('should return undefined when the id is missing', () => {
    expect(featuredProjectCardSelector(9)(bank({
      featuredProjectCards: featured,
    }))).toBeUndefined();
  });

  it('should return undefined before featured cards have loaded', () => {
    expect(featuredProjectCardSelector(1)(bank({}))).toBeUndefined();
  });
});
