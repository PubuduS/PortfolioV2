import { createSelector } from '@ngrx/store';

import { nextEducationId } from '../data-models/education/education';
import { StateSelector } from './state.selector';

/**
 * Select education section data from the store.
 */
export const educationSelector = createSelector(
  StateSelector,
  ({ education }) => education,
);

/**
 * Select the id a new education record would get.
 */
export const nextEducationIdSelector = createSelector(
  educationSelector,
  (education) => nextEducationId(education),
);
