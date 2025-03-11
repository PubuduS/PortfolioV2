import { createSelector } from '@ngrx/store';

import { projectCardsSelector } from './project-cards.selector';

/**
 * Select a project card based on the ID from the store.
 * @param id project card id
 * @returns ss
 */
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const projectCardSelector = (id: number) => createSelector(
  projectCardsSelector,
  (cards) => cards?.find((card) => card.id === id),
);
