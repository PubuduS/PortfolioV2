import { Injectable } from '@angular/core';
import {
  Actions,
  createEffect,
  ofType,
} from '@ngrx/effects';
import {
  Action,
  ActionCreator,
  Creator,
} from '@ngrx/store';
import {
  switchMap,
  catchError,
  map,
  Observable,
  EMPTY,
} from 'rxjs';

import { GetDataService } from '@portfolio-v2/shared/services';
import { StateActions } from './state.actions';
import {
  ABOUT_ME_COLLECTION,
  CERTIFICATE_COLLECTION,
  EDUCATION_COLLECTION,
  EXPERIENCE_COLLECTION,
  FEATURED_PROJECT_COLLECTION,
  IAboutMe,
  ICertificateCard,
  IEducation,
  IProjectCard,
  IProjectView,
  IPublication,
  IPublicationDetails,
  ISkills,
  ISocialInfor,
  PROJECT_DATA_COLLECTION,
  PROJECT_ICON_COLLECTION,
  PUBLICATION_COLLECTIONS,
  SKILLS_COLLECTION,
  SOCIAL_COLLECTION,
} from './data-models';

/** An action creator `ofType` can match. */
type ConnectAction = ActionCreator<string, Creator>;

/**
 * Side Effects for State Bank
 */
@Injectable()
export class StateEffects {
  /**
   * Constructor
   * @param actions ngrx actions
   * @param dbService database service
   */
  constructor(
    private actions: Actions,
    private dbService: GetDataService,
  ) {}

  /** Connects to about me state to get page information. */
  public connectToAboutMeState = createEffect(() => this.connectCollection(
    StateActions.aboutMeStateConnect,
    () => this.dbService.getData<IAboutMe>(ABOUT_ME_COLLECTION),
    (aboutMe) => StateActions.aboutMeStateUpdated({ aboutMe }),
  ));

  /** Connects to certificate cards state to get page information. */
  public connectToCertificatesCardsState = createEffect(() => this.connectCollection(
    StateActions.certificatesCardsStateConnect,
    () => this.dbService.getDataArray<ICertificateCard>(CERTIFICATE_COLLECTION, false),
    (certificates) => StateActions.certificatesCardsStateUpdated({ certificates }),
  ));

  /** Connects to education cards state to get page information. */
  public connectToEducatiuonCardsState = createEffect(() => this.connectCollection(
    StateActions.educationCardsStateConnect,
    () => this.dbService.getDataArray<IEducation>(EDUCATION_COLLECTION, false),
    (education) => StateActions.educationCardsStateUpdated({ education }),
  ));

  /** Connects to experiences state to get page information. */
  public connectToExperiencesState = createEffect(() => this.connectCollection(
    StateActions.experienceStateConnect,
    () => this.dbService.getExperienceSectionData(EXPERIENCE_COLLECTION),
    (experiences) => StateActions.experienceStateUpdated({ experiences }),
  ));

  /** Connects to portfolio cards state to get page information. */
  public connectToPortfolioCardsState = createEffect(() => this.connectCollection(
    StateActions.portfolioCardsStateConnect,
    () => this.dbService.getDataArray<IProjectView>(PROJECT_ICON_COLLECTION),
    (portfolioCards) => StateActions.portfolioCardsStateUpdated({ portfolioCards }),
  ));

  /** Connects to project cards state to get page information. */
  public connectToProjectCardsState = createEffect(() => this.connectCollection(
    StateActions.projectCardsStateConnect,
    () => this.dbService.getDataArray<IProjectCard>(PROJECT_DATA_COLLECTION),
    (projectCards) => StateActions.projectCardsStateUpdated({ projectCards }),
  ));

  /** Connects to featured project cards state to get page information. */
  public connectToFeaturedProjectCardsState = createEffect(() => this.connectCollection(
    StateActions.featuredProjectCardsStateConnect,
    () => this.dbService.getDataArray<IProjectCard>(FEATURED_PROJECT_COLLECTION),
    (projectCards) => StateActions.featuredProjectCardsStateUpdated({ projectCards }),
  ));

  /** Connects to publication cards state to get page information. */
  public connectToPublicationCardsState = createEffect(() => this.connectCollection(
    StateActions.publicationCardsStateConnect,
    () => this.dbService.getDataArray<IPublication>(PUBLICATION_COLLECTIONS.card),
    (publications) => StateActions.publicationCardsStateUpdated({ publications }),
  ));

  /** Connects to publication details cards state to get page information. */
  public connectToPublicationDetailsCardsState = createEffect(() => this.connectCollection(
    StateActions.publicationDetailCardsStateConnect,
    () => this.dbService.getDataArray<IPublicationDetails>(PUBLICATION_COLLECTIONS.details),
    (publicationDetails) => StateActions.publicationDetailCardsStateUpdated({
      publicationDetails,
    }),
  ));

  /** Connects to skills state to get page information. */
  public connectToSkillsState = createEffect(() => this.connectCollection(
    StateActions.skillsStateConnect,
    () => this.dbService.getData<ISkills>(SKILLS_COLLECTION),
    (skills) => StateActions.skillsStateUpdated({ skills }),
  ));

  /** Connects to social media information state to get page information. */
  public connectToSocialMediaInformationState = createEffect(() => this.connectCollection(
    StateActions.socialMediaInformationStateConnect,
    () => this.dbService.getDataArray<ISocialInfor>(SOCIAL_COLLECTION),
    (socialInfor) => StateActions.socialMediaInformationStateUpdated({ socialInfor }),
  ));

  /**
   * Subscribe to one collection and store what it emits.
   * A failed load leaves the slice at its last value.
   * @param connect action that opens the listener
   * @param load collection read
   * @param updated action that stores the loaded value
   * @returns the effect stream
   */
  private connectCollection<T, A extends Action>(
    connect: ConnectAction,
    load: () => Observable<T>,
    updated: (value: T) => A,
  ): Observable<A> {
    return this.actions.pipe(
      ofType(connect),
      switchMap(() => load().pipe(
        map((value) => updated(value)),
        catchError(() => EMPTY),
      )),
    );
  }
}
