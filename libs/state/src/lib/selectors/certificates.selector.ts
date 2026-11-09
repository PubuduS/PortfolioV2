import { createSelector } from '@ngrx/store';

import { nextCertificateId } from '@portfolio-v2/state/dataModels';
import { StateSelector } from './state.selector';

/**
 * Select certificates section data from the store.
 */
export const certificatesSelector = createSelector(
  StateSelector,
  ({ certificates }) => certificates,
);

/**
 * Select the id a new certificate would get.
 */
export const nextCertificateIdSelector = createSelector(
  certificatesSelector,
  (certificates) => nextCertificateId(certificates),
);
