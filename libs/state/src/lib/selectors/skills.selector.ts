import { createSelector } from '@ngrx/store';

import { StateSelector } from './state.selector';

/**
 * Select skills section data from the store.
 */
export const skillsSelector = createSelector(
  StateSelector,
  ({ skills }) => skills,
);
