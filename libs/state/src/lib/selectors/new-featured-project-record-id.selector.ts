import * as _ from 'lodash';
import { createSelector } from '@ngrx/store';

import { featuredProjectCardsSelector } from './featured-project-cards.selector';

/**
 * Select portfolio cards data from the store.
 */
export const newFeaturedProjectRecordIdSelector = createSelector(
  featuredProjectCardsSelector,
  (featuredProjectCards) => (_.last(featuredProjectCards)?.id ?? 1) + 1,
);
