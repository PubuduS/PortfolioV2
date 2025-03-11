import { createFeatureSelector } from '@ngrx/store';

import { StoreState } from '../state.state';

/**
 * Select a state slice from the store.
 */
export const StateSelector = createFeatureSelector<StoreState>('stateBanks');
