import { createSelector } from '@ngrx/store';

import { StateSelector } from './state.selector';

/**
 * Select project cards from the store.
 */
export const projectCardsSelector = createSelector(
  StateSelector,
  ({ projectCards }) => projectCards,
);
