import { createSelector } from '@ngrx/store';

import { StateSelector } from './state.selector';

/**
 * Select social media from the store.
 */
export const socialMediaSelector = createSelector(
  StateSelector,
  ({ socialInfor }) => socialInfor,
);
