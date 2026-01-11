import { createSelector } from '@ngrx/store';

import { portfolioCardsSelector } from './portfolio-cards.selector';

/**
 * Select a project card based on the ID from the store.
 * @param id project card id
 * @returns ss
 */
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const portfolioCardSelector = (id: number) => createSelector(
  portfolioCardsSelector,
  (cards) => cards?.find((card) => card.id === id),
);
