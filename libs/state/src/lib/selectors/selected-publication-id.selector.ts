import { createSelector } from '@ngrx/store';

import { StateSelector } from './state.selector';

/**
 * Get the selected publication ID.
 */
export const selectedPublicationIDSelector = createSelector(
  StateSelector,
  ({ selectedPublicationID }) => selectedPublicationID,
);
