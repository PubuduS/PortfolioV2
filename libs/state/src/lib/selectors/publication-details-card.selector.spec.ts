import {
  IPublication,
  IPublicationDetails,
} from '../data-models';
import { StoreState } from '../state.state';
import { publicationDetailCardSelector } from './publication-details-card.selector';

/**
 * @param id detail id
 * @param title title that identifies which slice the record came from
 * @returns a publication detail record
 */
function detail(id: number, title: string): IPublicationDetails {
  return {
    id,
    title,
    authors: '',
    abstarct: [],
    citation: '',
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

describe('publicationDetailCardSelector', () => {
  const details = [detail(1, 'One'), detail(4, 'Detail')];

  it('should return the detail record with that id', () => {
    expect(publicationDetailCardSelector(4)(bank({
      publicationDetails: details,
    }))).toEqual(details[1]);
  });

  it('should read detail records rather than a publication card with the same id', () => {
    const card = { id: 4, title: 'Card' } as IPublication;

    expect(publicationDetailCardSelector(4)(bank({
      publicationDetails: details,
      publications: [card],
    }))).toEqual(detail(4, 'Detail'));
  });

  it('should return undefined when the id is missing', () => {
    expect(publicationDetailCardSelector(9)(bank({ publicationDetails: details }))).toBeUndefined();
  });

  it('should return undefined before detail records have loaded', () => {
    expect(publicationDetailCardSelector(1)(bank({}))).toBeUndefined();
  });
});
