import { Injectable } from '@angular/core';
import {
  Actions,
  createEffect,
  ofType,
} from '@ngrx/effects';
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
  IExperience,
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

  /**
   * Connects to about me state to get page information.
   */
  public connectToAboutMeState = createEffect(() => this.actions.pipe(
    ofType(StateActions.aboutMeStateConnect),
    switchMap(() => this.dbService.getData<IAboutMe>(ABOUT_ME_COLLECTION).pipe(
      map((aboutMe: IAboutMe) => StateActions.aboutMeStateUpdated({ aboutMe })),
      catchError((error: Error) => this.handleErrors('About-me', error)),
    )),
  ));

  /**
   * Connects to certificate cards state to get page information.
   */
  public connectToCertificatesCardsState = createEffect(() => this.actions.pipe(
    ofType(StateActions.certificatesCardsStateConnect),
    switchMap(() => this.dbService
      .getDataArray<ICertificateCard>(CERTIFICATE_COLLECTION, false).pipe(
      map((certificates: ICertificateCard[]) => StateActions
        .certificatesCardsStateUpdated({ certificates })),
      catchError((error: Error) => this.handleErrors('Certificates card', error)),
    )),
  ));

  /**
   * Connects to education cards state to get page information.
   */
  public connectToEducatiuonCardsState = createEffect(() => this.actions.pipe(
    ofType(StateActions.educationCardsStateConnect),
    switchMap(() => this.dbService.getDataArray<IEducation>(EDUCATION_COLLECTION, false).pipe(
      map((education: IEducation[]) => StateActions
        .educationCardsStateUpdated({ education })),
      catchError((error: Error) => this.handleErrors('Education card', error)),
    )),
  ));

  /**
   * Connects to experiences state to get page information.
   */
  public connectToExperiencesState = createEffect(() => this.actions.pipe(
    ofType(StateActions.experienceStateConnect),
    switchMap(() => this.dbService.getExperienceSectionData(EXPERIENCE_COLLECTION).pipe(
      map((experiences: IExperience[]) => StateActions.experienceStateUpdated({ experiences })),
      catchError((error: Error) => this.handleErrors('Experience', error)),
    )),
  ));

  /**
   * Connects to portfolio cards state to get page information.
   */
  public connectToPortfolioCardsState = createEffect(() => this.actions.pipe(
    ofType(StateActions.portfolioCardsStateConnect),
    switchMap(() => this.dbService.getDataArray<IProjectView>(PROJECT_ICON_COLLECTION).pipe(
      map((portfolioCards: IProjectView[]) => StateActions
        .portfolioCardsStateUpdated({ portfolioCards })),
      catchError((error: Error) => this.handleErrors('Portfolio card error', error)),
    )),
  ));

  /**
   * Connects to project cards state to get page information.
   */
  public connectToProjectCardsState = createEffect(() => this.actions.pipe(
    ofType(StateActions.projectCardsStateConnect),
    switchMap(() => this.dbService.getDataArray<IProjectCard>(PROJECT_DATA_COLLECTION).pipe(
      map((projectCards: IProjectCard[]) => StateActions
        .projectCardsStateUpdated({ projectCards })),
      catchError((error: Error) => this.handleErrors('Project card', error)),
    )),
  ));

  /**
   * Connects to featured project cards state to get page information.
   */
  public connectToFeaturedProjectCardsState = createEffect(() => this.actions.pipe(
    ofType(StateActions.featuredProjectCardsStateConnect),
    switchMap(() => this.dbService.getDataArray<IProjectCard>(FEATURED_PROJECT_COLLECTION).pipe(
      map((projectCards: IProjectCard[]) => StateActions
        .featuredProjectCardsStateUpdated({ projectCards })),
      catchError((error: Error) => this.handleErrors('Featured project card', error)),
    )),
  ));

  /**
   * Connects to publication cards state to get page information.
   */
  public connectToPublicationCardsState = createEffect(() => this.actions.pipe(
    ofType(StateActions.publicationCardsStateConnect),
    switchMap(() => this.dbService.getDataArray<IPublication>(PUBLICATION_COLLECTIONS.card).pipe(
      map((publications: IPublication[]) => StateActions
        .publicationCardsStateUpdated({ publications })),
      catchError((error: Error) => this.handleErrors('Publication card', error)),
    )),
  ));

  /**
   * Connects to publication details cards state to get page information.
   */
  public connectToPublicationDetailsCardsState = createEffect(() => this.actions.pipe(
    ofType(StateActions.publicationDetailCardsStateConnect),
    switchMap(() => this.dbService.getDataArray<IPublicationDetails>(
      PUBLICATION_COLLECTIONS.details,
    ).pipe(
      map((publicationDetails: IPublicationDetails[]) => StateActions
        .publicationDetailCardsStateUpdated({ publicationDetails })),
      catchError((error: Error) => this.handleErrors('Publication details card', error)),
    )),
  ));

  /**
   * Connects to skills state to get page information.
   */
  public connectToSkillsState = createEffect(() => this.actions.pipe(
    ofType(StateActions.skillsStateConnect),
    switchMap(() => this.dbService.getData<ISkills>(SKILLS_COLLECTION).pipe(
      map((skills: ISkills) => StateActions.skillsStateUpdated({ skills })),
      catchError((error: Error) => this.handleErrors('Skills', error)),
    )),
  ));

  /**
   * Connects to social media information state to get page information.
   */
  public connectToSocialMediaInformationState = createEffect(() => this.actions.pipe(
    ofType(StateActions.socialMediaInformationStateConnect),
    switchMap(() => this.dbService.getDataArray<ISocialInfor>(SOCIAL_COLLECTION).pipe(
      map((socialInfor: ISocialInfor[]) => StateActions
        .socialMediaInformationStateUpdated({ socialInfor })),
      catchError((error: Error) => this.handleErrors('Social media information state', error)),
    )),
  ));

  /**
   * Drop a failed load so the slice stays at its last value.
   * @param _place which collection failed
   * @param _error failure from Firestore
   * @returns empty observable
   */
  private handleErrors(_place: string, _error: Error): Observable<never> {
    return EMPTY;
  }
}
