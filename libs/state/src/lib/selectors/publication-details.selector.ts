import { createSelector } from '@ngrx/store';

import { StateSelector } from './state.selector';

/**
 * Select publication details cards from the store.
 */
export const publicationDetailsCardsSelector = createSelector(
  StateSelector,
  ({ publicationDetails }) => publicationDetails,
);
