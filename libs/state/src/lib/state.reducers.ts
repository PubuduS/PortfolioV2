import {
  createReducer,
  on,
} from '@ngrx/store';

import { StateActions } from './state.actions';
import { StoreState } from './state.state';

const initialState: StoreState = {
  aboutMe: undefined,
  skills: undefined,
  experiences: undefined,
  portfolioCards: undefined,
  projectCards: undefined,
  selectedProjectCardID: 0,
  certificates: undefined,
  education: undefined,
  publications: undefined,
  selectedPublicationID: 0,
  publicationDetails: undefined,
  socialInfor: undefined,
  isAdmin: false,
};

export const stateReducers = createReducer<StoreState>(
  initialState,

  on(StateActions.aboutMeStateUpdated, (state, { aboutMe }): StoreState => ({
    ...state,
    aboutMe,
  })),

  on(StateActions.skillsStateUpdated, (state, { skills }): StoreState => ({
    ...state,
    skills,
  })),

  on(StateActions.experienceStateUpdated, (state, { experiences }): StoreState => ({
    ...state,
    experiences,
  })),

  on(StateActions.portfolioCardsStateUpdated, (state, { portfolioCards }): StoreState => ({
    ...state,
    portfolioCards,
  })),

  on(StateActions.projectCardsStateUpdated, (state, { projectCards }): StoreState => ({
    ...state,
    projectCards,
  })),

  on(StateActions.projectCardIDStateUpdated, (state, { selectedProjectCardID }): StoreState => ({
    ...state,
    selectedProjectCardID,
  })),

  on(StateActions.certificatesCardsStateUpdated, (state, { certificates }): StoreState => ({
    ...state,
    certificates,
  })),

  on(StateActions.educationCardsStateUpdated, (state, { education }): StoreState => ({
    ...state,
    education,
  })),

  on(StateActions.publicationCardsStateUpdated, (state, { publications }): StoreState => ({
    ...state,
    publications,
  })),

  on(
    StateActions.selectedPublicationCardIDStateUpdated,
    (state, { selectedPublicationID }): StoreState => ({
      ...state,
      selectedPublicationID,
    }),
  ),

  on(
    StateActions.publicationDetailCardsStateUpdated,
    (state, { publicationDetails }): StoreState => ({
      ...state,
      publicationDetails,
    }),
  ),

  on(StateActions.socialMediaInformationStateUpdated, (state, { socialInfor }): StoreState => ({
    ...state,
    socialInfor,
  })),

  on(StateActions.adminStateUpdated, (state, { isAdmin }): StoreState => ({
    ...state,
    isAdmin,
  })),
);
