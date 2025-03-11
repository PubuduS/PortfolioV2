import { createSelector } from '@ngrx/store';

import { StateSelector } from './state.selector';

/**
 * Select portfolio cards data from the store.
 */
export const portfolioCardsSelector = createSelector(
  StateSelector,
  ({ portfolioCards }) => portfolioCards,
);
