import { createSelector } from '@ngrx/store';

import { StateSelector } from './state.selector';

/**
 * Select certificates section data from the store.
 */
export const certificatesSelector = createSelector(
  StateSelector,
  ({ certificates }) => certificates,
);
