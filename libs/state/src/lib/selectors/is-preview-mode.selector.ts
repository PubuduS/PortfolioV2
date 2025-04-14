import { createSelector } from '@ngrx/store';

import { StateSelector } from './state.selector';

/**
 * Select whether the user is in preview mode or not.
 */
export const isPreviewModeSelector = createSelector(
  StateSelector,
  ({ isPreviewMode }) => isPreviewMode,
);
