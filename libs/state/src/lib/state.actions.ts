import {
  createActionGroup,
  emptyProps,
  props,
} from '@ngrx/store';

import {
  IAboutMe,
  ICertificateCard,
  IEducation,
  IExperience,
  IProjectCard,
  IProjectView,
  IPublication,
  IPublicationDetails,
  ISkills,
  ISocialInfo,
} from '@portfolio-v2/state/dataModels';

/** Actions that load and replace slices of the portfolio store. */
export const StateActions = createActionGroup({
  source: 'State',
  events: {
    'About Me State Connect': emptyProps(),
    'About Me State Updated': props<{ aboutMe: IAboutMe }>(),

    'Skills State Connect': emptyProps(),
    'Skills State Updated': props<{ skills: ISkills }>(),

    'Experience State Connect': emptyProps(),
    'Experience State Updated': props<{ experiences: IExperience[] }>(),

    'Portfolio Cards State Connect': emptyProps(),
    'Portfolio Cards State Updated': props<{ portfolioCards: IProjectView[] }>(),

    'Project Cards State Connect': emptyProps(),
    'Project Cards State Updated': props<{ projectCards: IProjectCard[] }>(),

    'Featured Project Cards State Connect': emptyProps(),
    'Featured Project Cards State Updated': props<{ projectCards: IProjectCard[] }>(),

    'Project Card ID State Updated': props<{ selectedProjectCardID: number }>(),

    'Certificates Cards State Connect': emptyProps(),
    'Certificates Cards State Updated': props<{ certificates: ICertificateCard[] }>(),

    'Education Cards State Connect': emptyProps(),
    'Education Cards State Updated': props<{ education: IEducation[] }>(),

    'Publication Cards State Connect': emptyProps(),
    'Publication Cards State Updated': props<{ publications: IPublication[] }>(),

    'Selected Publication Card ID State Updated': props<{ selectedPublicationID: number }>(),

    'Publication Detail Cards State Connect': emptyProps(),
    'Publication Detail Cards State Updated': props<{ publicationDetails: IPublicationDetails[] }>(),

    'Social Media Information State Connect': emptyProps(),
    'Social Media Information State Updated': props<{ socialInfor: ISocialInfo[] }>(),

    'Admin State Updated': props<{ isAdmin: boolean }>(),

    'Preview Mode State Updated': props<{ isPreviewMode: boolean }>(),

    'Party Mode State Updated': props<{ isPartyMode: boolean }>(),
  },
});
