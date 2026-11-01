import {
  IProjectCard,
  IProjectView,
} from '../data-models';
import { StoreState } from '../state.state';
import { newProjectRecordIdSelector } from './new-project-record-id.selector';

/**
 * @param id card id
 * @returns a portfolio card
 */
function portfolioCard(id: number): IProjectView {
  return {
    id,
    viewHeading: `View ${id}`,
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

describe('newProjectRecordIdSelector', () => {
  it('should be 2 before portfolio cards have loaded', () => {
    expect(newProjectRecordIdSelector(bank({}))).toBe(2);
  });

  it('should be 2 when the portfolio list is empty', () => {
    expect(newProjectRecordIdSelector(bank({ portfolioCards: [] }))).toBe(2);
  });

  it('should add one to the last portfolio card and ignore earlier ids', () => {
    expect(newProjectRecordIdSelector(bank({
      portfolioCards: [portfolioCard(9), portfolioCard(4)],
    }))).toBe(5);
  });

  it('should ignore project cards', () => {
    const projectCard = {
      id: 20,
      heading: 'Project',
      description: '',
      tools: '',
      imageURL: '',
    } as IProjectCard;

    expect(newProjectRecordIdSelector(bank({
      portfolioCards: [portfolioCard(4)],
      projectCards: [projectCard],
    }))).toBe(5);
  });
});
