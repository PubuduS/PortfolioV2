import { TestBed } from '@angular/core/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { Action } from '@ngrx/store';
import {
  Observable,
  Subject,
  firstValueFrom,
  of,
  throwError,
} from 'rxjs';

import { GetDataService } from '@portfolio-v2/data-access/get-data';
import {
  ABOUT_ME_COLLECTION,
  CERTIFICATE_COLLECTION,
  EDUCATION_COLLECTION,
  EXPERIENCE_COLLECTION,
  FEATURED_PROJECT_COLLECTION,
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
  PROJECT_DATA_COLLECTION,
  PROJECT_ICON_COLLECTION,
  PUBLICATION_COLLECTIONS,
  SKILLS_COLLECTION,
  SOCIAL_COLLECTION,
} from '@portfolio-v2/state/dataModels';
import { StateActions } from './state.actions';
import { StateEffects } from './state.effects';

/** Methods the load effects call. */
interface DataApi {
  getData: jest.Mock;
  getDataArray: jest.Mock;
  getExperienceSectionData: jest.Mock;
}

/** One connect effect and the collection it must read. */
interface LoadCase {
  label: string;
  method: keyof DataApi;
  args: unknown[];
  read: (effects: StateEffects) => Observable<Action>;
  connect: Action;
  updated: (payload: unknown) => Action;
}

const record = { id: 1 };
const records = [{ id: 1 }];

const cases: LoadCase[] = [
  {
    label: 'about me',
    method: 'getData',
    args: [ABOUT_ME_COLLECTION],
    read: (effects) => effects.connectToAboutMeState,
    connect: StateActions.aboutMeStateConnect(),
    updated: (payload) => StateActions.aboutMeStateUpdated({ aboutMe: payload as IAboutMe }),
  },
  {
    label: 'skills',
    method: 'getData',
    args: [SKILLS_COLLECTION],
    read: (effects) => effects.connectToSkillsState,
    connect: StateActions.skillsStateConnect(),
    updated: (payload) => StateActions.skillsStateUpdated({ skills: payload as ISkills }),
  },
  {
    label: 'experience',
    method: 'getExperienceSectionData',
    args: [EXPERIENCE_COLLECTION],
    read: (effects) => effects.connectToExperiencesState,
    connect: StateActions.experienceStateConnect(),
    updated: (payload) => StateActions.experienceStateUpdated({
      experiences: payload as IExperience[],
    }),
  },
  {
    label: 'portfolio cards',
    method: 'getDataArray',
    args: [PROJECT_ICON_COLLECTION],
    read: (effects) => effects.connectToPortfolioCardsState,
    connect: StateActions.portfolioCardsStateConnect(),
    updated: (payload) => StateActions.portfolioCardsStateUpdated({
      portfolioCards: payload as IProjectView[],
    }),
  },
  {
    label: 'project cards',
    method: 'getDataArray',
    args: [PROJECT_DATA_COLLECTION],
    read: (effects) => effects.connectToProjectCardsState,
    connect: StateActions.projectCardsStateConnect(),
    updated: (payload) => StateActions.projectCardsStateUpdated({
      projectCards: payload as IProjectCard[],
    }),
  },
  {
    label: 'featured project cards',
    method: 'getDataArray',
    args: [FEATURED_PROJECT_COLLECTION],
    read: (effects) => effects.connectToFeaturedProjectCardsState,
    connect: StateActions.featuredProjectCardsStateConnect(),
    updated: (payload) => StateActions.featuredProjectCardsStateUpdated({
      projectCards: payload as IProjectCard[],
    }),
  },
  {
    label: 'certificates',
    method: 'getDataArray',
    args: [CERTIFICATE_COLLECTION, false],
    read: (effects) => effects.connectToCertificatesCardsState,
    connect: StateActions.certificatesCardsStateConnect(),
    updated: (payload) => StateActions.certificatesCardsStateUpdated({
      certificates: payload as ICertificateCard[],
    }),
  },
  {
    label: 'education',
    method: 'getDataArray',
    args: [EDUCATION_COLLECTION, false],
    read: (effects) => effects.connectToEducationCardsState,
    connect: StateActions.educationCardsStateConnect(),
    updated: (payload) => StateActions.educationCardsStateUpdated({
      education: payload as IEducation[],
    }),
  },
  {
    label: 'publications',
    method: 'getDataArray',
    args: [PUBLICATION_COLLECTIONS.card],
    read: (effects) => effects.connectToPublicationCardsState,
    connect: StateActions.publicationCardsStateConnect(),
    updated: (payload) => StateActions.publicationCardsStateUpdated({
      publications: payload as IPublication[],
    }),
  },
  {
    label: 'publication details',
    method: 'getDataArray',
    args: [PUBLICATION_COLLECTIONS.details],
    read: (effects) => effects.connectToPublicationDetailsCardsState,
    connect: StateActions.publicationDetailCardsStateConnect(),
    updated: (payload) => StateActions.publicationDetailCardsStateUpdated({
      publicationDetails: payload as IPublicationDetails[],
    }),
  },
  {
    label: 'social links',
    method: 'getDataArray',
    args: [SOCIAL_COLLECTION],
    read: (effects) => effects.connectToSocialMediaInformationState,
    connect: StateActions.socialMediaInformationStateConnect(),
    updated: (payload) => StateActions.socialMediaInformationStateUpdated({
      socialInfor: payload as ISocialInfo[],
    }),
  },
];

describe('StateEffects', () => {
  let actions: Subject<Action>;
  let effects: StateEffects;
  const db: DataApi = {
    getData: jest.fn(),
    getDataArray: jest.fn(),
    getExperienceSectionData: jest.fn(),
  };

  beforeEach(() => {
    db.getData.mockReset();
    db.getDataArray.mockReset();
    db.getExperienceSectionData.mockReset();
    actions = new Subject<Action>();
    TestBed.configureTestingModule({
      providers: [
        StateEffects,
        provideMockActions(() => actions),
        { provide: GetDataService, useValue: db },
      ],
    });
    effects = TestBed.inject(StateEffects);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('when a slice loads', () => {
    it.each(cases)('should store $label from its collection', async (entry) => {
      const payload = entry.method === 'getData' ? record : records;
      db[entry.method].mockReturnValue(of(payload));
      const pending = firstValueFrom(entry.read(effects));

      actions.next(entry.connect);

      expect(await pending).toEqual(entry.updated(payload));
      expect(db[entry.method]).toHaveBeenCalledWith(...entry.args);
    });
  });

  describe('when a slice fails to load', () => {
    it.each(cases)('should emit nothing for $label', async (entry) => {
      jest.spyOn(console, 'log').mockImplementation(() => undefined);
      db[entry.method].mockReturnValue(throwError(() => new Error('down')));
      const emitted: Action[] = [];
      const subscription = entry.read(effects).subscribe((action) => {
        emitted.push(action);
      });

      actions.next(entry.connect);
      await new Promise((resolve) => {
        setTimeout(resolve, 0);
      });
      subscription.unsubscribe();

      expect(emitted).toEqual([]);
      expect(db[entry.method]).toHaveBeenCalledWith(...entry.args);
    });
  });
});
