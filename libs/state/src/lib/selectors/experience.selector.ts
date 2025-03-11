import { createSelector } from '@ngrx/store';

import { StateSelector } from './state.selector';

/**
 * Select experience section data from the store.
 */
export const experienceSelector = createSelector(
  StateSelector,
  ({ experiences }) => experiences,
);
