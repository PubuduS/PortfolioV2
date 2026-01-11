import { createSelector } from '@ngrx/store';

import { StateSelector } from './state.selector';

/**
 * Select featured project cards from the store.
 */
export const featuredProjectCardsSelector = createSelector(
  StateSelector,
  ({ featuredProjectCards }) => featuredProjectCards,
);
