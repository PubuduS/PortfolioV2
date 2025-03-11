import { createSelector } from '@ngrx/store';

import { publicationDetailsCardsSelector } from './publication-details.selector';

/**
 * Select a publication detail card based on the ID from the store.
 * @param id publication details card id
 * @returns selector
 */
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const publicationDetailCardSelector = (id: number) => createSelector(
  publicationDetailsCardsSelector,
  (cards) => cards?.find((card) => card.id === id),
);
