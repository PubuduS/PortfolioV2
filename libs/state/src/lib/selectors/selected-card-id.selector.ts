import { createSelector } from '@ngrx/store';

import { StateSelector } from './state.selector';

/**
 * Get the selected project card ID.
 */
export const selectedCardIDSelector = createSelector(
  StateSelector,
  ({ selectedProjectCardID }) => selectedProjectCardID,
);
