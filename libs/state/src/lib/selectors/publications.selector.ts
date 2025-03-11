import { createSelector } from '@ngrx/store';

import { StateSelector } from './state.selector';

/**
 * Select publication cards from the store.
 */
export const publicationCardsSelector = createSelector(
  StateSelector,
  ({ publications }) => publications,
);
