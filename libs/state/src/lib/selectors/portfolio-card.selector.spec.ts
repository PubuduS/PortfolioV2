import { IProjectView } from '../data-models';
import { StoreState } from '../state.state';
import { portfolioCardSelector } from './portfolio-card.selector';

/**
 * @param id card id
 * @param viewHeading heading that identifies which slice the card came from
 * @returns a portfolio card
 */
function portfolioCard(id: number, viewHeading: string): IProjectView {
  return {
    id,
    viewHeading,
    viewDescription: '',
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

describe('portfolioCardSelector', () => {
  const cards = [portfolioCard(1, 'One'), portfolioCard(2, 'Portfolio')];

  it('should return the portfolio card with that id', () => {
    expect(portfolioCardSelector(2)(bank({ portfolioCards: cards }))).toEqual(cards[1]);
  });

  it('should read portfolio cards rather than a project card with the same id', () => {
    expect(portfolioCardSelector(2)(bank({
      portfolioCards: cards,
      projectCards: [{
        id: 2,
        heading: 'Project',
        description: '',
        tools: '',
        imageURL: '',
      }],
    }))).toEqual(portfolioCard(2, 'Portfolio'));
  });

  it('should return undefined when the id is missing', () => {
    expect(portfolioCardSelector(9)(bank({ portfolioCards: cards }))).toBeUndefined();
  });

  it('should return undefined before portfolio cards have loaded', () => {
    expect(portfolioCardSelector(1)(bank({}))).toBeUndefined();
  });
});
