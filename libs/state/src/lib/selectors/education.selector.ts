import { createSelector } from '@ngrx/store';

import { StateSelector } from './state.selector';

/**
 * Select education section data from the store.
 */
export const educationSelector = createSelector(
  StateSelector,
  ({ education }) => education,
);
