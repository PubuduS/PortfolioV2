import { Action } from '@ngrx/store';

import { StateActions } from './state.actions';
import { stateReducers } from './state.reducers';
import { StoreState } from './state.state';

/**
 * @returns the store before any slice has loaded
 */
function fresh(): StoreState {
  return stateReducers(undefined, { type: 'init' });
}

describe('stateReducers', () => {
  it('should start with empty content and the mode flags off', () => {
    expect(fresh()).toEqual({
      aboutMe: undefined,
      skills: undefined,
      experiences: undefined,
      portfolioCards: undefined,
      projectCards: undefined,
      featuredProjectCards: undefined,
      selectedProjectCardID: 0,
      certificates: undefined,
      education: undefined,
      publications: undefined,
      selectedPublicationID: 0,
      publicationDetails: undefined,
      socialInfor: undefined,
      isAdmin: false,
      isPreviewMode: false,
      isPartyMode: false,
    });
  });

  describe('when a slice is updated', () => {
    const aboutMe = { name: 'Ada' } as NonNullable<StoreState['aboutMe']>;
    const skills = { groups: [] } as NonNullable<StoreState['skills']>;
    const experiences = [{ id: 1 }] as NonNullable<StoreState['experiences']>;
    const portfolioCards = [{ id: 2 }] as NonNullable<StoreState['portfolioCards']>;
    const projectCards = [{ id: 3 }] as NonNullable<StoreState['projectCards']>;
    const featuredProjectCards = [{ id: 4 }] as NonNullable<StoreState['featuredProjectCards']>;
    const certificates = [{ id: 5 }] as NonNullable<StoreState['certificates']>;
    const education = [{ id: 6 }] as NonNullable<StoreState['education']>;
    const publications = [{ id: 7 }] as NonNullable<StoreState['publications']>;
    const publicationDetails = [{ id: 8 }] as NonNullable<StoreState['publicationDetails']>;
    const socialInfor = [{ id: 9 }] as NonNullable<StoreState['socialInfor']>;

    const cases: {
      label: string;
      key: keyof StoreState;
      value: StoreState[keyof StoreState];
      action: Action;
    }[] = [
      {
        label: 'about me',
        key: 'aboutMe',
        value: aboutMe,
        action: StateActions.aboutMeStateUpdated({ aboutMe }),
      },
      {
        label: 'skills',
        key: 'skills',
        value: skills,
        action: StateActions.skillsStateUpdated({ skills }),
      },
      {
        label: 'experience',
        key: 'experiences',
        value: experiences,
        action: StateActions.experienceStateUpdated({ experiences }),
      },
      {
        label: 'portfolio cards',
        key: 'portfolioCards',
        value: portfolioCards,
        action: StateActions.portfolioCardsStateUpdated({ portfolioCards }),
      },
      {
        label: 'project cards',
        key: 'projectCards',
        value: projectCards,
        action: StateActions.projectCardsStateUpdated({ projectCards }),
      },
      {
        label: 'featured project cards',
        key: 'featuredProjectCards',
        value: featuredProjectCards,
        action: StateActions.featuredProjectCardsStateUpdated({
          projectCards: featuredProjectCards,
        }),
      },
      {
        label: 'the selected project card',
        key: 'selectedProjectCardID',
        value: 8,
        action: StateActions.projectCardIDStateUpdated({ selectedProjectCardID: 8 }),
      },
      {
        label: 'certificates',
        key: 'certificates',
        value: certificates,
        action: StateActions.certificatesCardsStateUpdated({ certificates }),
      },
      {
        label: 'education',
        key: 'education',
        value: education,
        action: StateActions.educationCardsStateUpdated({ education }),
      },
      {
        label: 'publications',
        key: 'publications',
        value: publications,
        action: StateActions.publicationCardsStateUpdated({ publications }),
      },
      {
        label: 'the selected publication',
        key: 'selectedPublicationID',
        value: 3,
        action: StateActions.selectedPublicationCardIDStateUpdated({ selectedPublicationID: 3 }),
      },
      {
        label: 'publication details',
        key: 'publicationDetails',
        value: publicationDetails,
        action: StateActions.publicationDetailCardsStateUpdated({ publicationDetails }),
      },
      {
        label: 'social links',
        key: 'socialInfor',
        value: socialInfor,
        action: StateActions.socialMediaInformationStateUpdated({ socialInfor }),
      },
      {
        label: 'admin mode',
        key: 'isAdmin',
        value: true,
        action: StateActions.adminStateUpdated({ isAdmin: true }),
      },
      {
        label: 'preview mode',
        key: 'isPreviewMode',
        value: true,
        action: StateActions.previewModeStateUpdated({ isPreviewMode: true }),
      },
      {
        label: 'party mode',
        key: 'isPartyMode',
        value: true,
        action: StateActions.partyModeStateUpdated({ isPartyMode: true }),
      },
    ];

    it.each(cases)('should replace $label and leave the other slices', ({ key, value, action }) => {
      const before = fresh();
      const next = stateReducers(before, action);

      expect(next).toEqual({ ...before, [key]: value });
      expect(before).toEqual(fresh());
    });
  });

  it('should keep the current state for an unrelated action', () => {
    const before = fresh();

    expect(stateReducers(before, { type: 'other' })).toBe(before);
  });
});
