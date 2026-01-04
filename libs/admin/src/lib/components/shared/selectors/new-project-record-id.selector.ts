import * as _ from 'lodash';
import { createSelector } from '@ngrx/store';

import { portfolioCardsSelector } from '@portfolio-v2/state/selectors';

/**
 * Select portfolio cards data from the store.
 */
export const newProjectRecordIdSelector = createSelector(
  portfolioCardsSelector,
  (portfolioCards) => (_.last(portfolioCards)?.id ?? 1) + 1,
);
