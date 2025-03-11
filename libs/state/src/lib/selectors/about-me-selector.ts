import { createSelector } from '@ngrx/store';

import { StateSelector } from './state.selector';

/**
 * Select about me section data from the store.
 */
export const aboutMeSelector = createSelector(
  StateSelector,
  ({ aboutMe }) => aboutMe,
);
