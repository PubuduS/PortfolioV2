import { createSelector } from '@ngrx/store';

import {
  joinPublications,
  nextPublicationId,
} from '../data-models/publications/publication';
import { publicationDetailsCardsSelector } from './publication-details.selector';
import { publicationCardsSelector } from './publications.selector';

/**
 * Select joined publications. Orphan details are omitted.
 */
export const publicationRecordsSelector = createSelector(
  publicationCardsSelector,
  publicationDetailsCardsSelector,
  (cards, details) => joinPublications(cards, details),
);

/**
 * Select the next publication id from both collections.
 */
export const nextPublicationRecordIdSelector = createSelector(
  publicationCardsSelector,
  publicationDetailsCardsSelector,
  (cards, details) => nextPublicationId(cards, details),
);
