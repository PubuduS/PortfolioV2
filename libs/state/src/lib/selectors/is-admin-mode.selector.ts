import { createSelector } from '@ngrx/store';

import { StateSelector } from './state.selector';

/**
 * Select whether the user is in admin mode or not.
 */
export const isAdminModeSelector = createSelector(
  StateSelector,
  ({ isAdmin }) => isAdmin,
);
