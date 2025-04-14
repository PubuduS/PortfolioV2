import { createSelector } from '@ngrx/store';

import { StateSelector } from './state.selector';

/**
 * Select whether the user is in party mode or not.
 */
export const isPartyModeSelector = createSelector(
  StateSelector,
  ({ isPartyMode }) => isPartyMode,
);
