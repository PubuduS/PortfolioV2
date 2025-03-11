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
    switchMap(() => this.dbService.getData<IAboutMe>('about-me-section').pipe(
      map((aboutMe: IAboutMe) => StateActions.aboutMeStateUpdated({ aboutMe })),
      catchError((error: Error) => this.handleErrors('About-me', error)),
    )),
  ));

  /**
   * Connects to certificate cards state to get page information.
   */
  public connectToCertificatesCardsState = createEffect(() => this.actions.pipe(
    ofType(StateActions.certificatesCardsStateConnect),
    switchMap(() => this.dbService.getDataArray<ICertificateCard>('certification-section', false).pipe(
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
    switchMap(() => this.dbService.getDataArray<IEducation>('education-section', false).pipe(
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
    switchMap(() => this.dbService.getExperienceSectionData('experience-section').pipe(
      map((experiences: IExperience[]) => StateActions.experienceStateUpdated({ experiences })),
      catchError((error: Error) => this.handleErrors('Experience', error)),
    )),
  ));

  /**
   * Connects to portfolio cards state to get page information.
   */
  public connectToPortfolioCardsState = createEffect(() => this.actions.pipe(
    ofType(StateActions.portfolioCardsStateConnect),
    switchMap(() => this.dbService.getDataArray<IProjectView>('project-icon-section').pipe(
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
    switchMap(() => this.dbService.getDataArray<IProjectCard>('project-data-section').pipe(
      map((projectCards: IProjectCard[]) => StateActions
        .projectCardsStateUpdated({ projectCards })),
      catchError((error: Error) => this.handleErrors('Project card', error)),
    )),
  ));

  /**
   * Connects to publication cards state to get page information.
   */
  public connectToPublicationCardsState = createEffect(() => this.actions.pipe(
    ofType(StateActions.publicationCardsStateConnect),
    switchMap(() => this.dbService.getDataArray<IPublication>('publication-section').pipe(
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
    switchMap(() => this.dbService.getDataArray<IPublicationDetails>('publication-details-section').pipe(
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
    switchMap(() => this.dbService.getData<ISkills>('skills-section').pipe(
      map((skills: ISkills) => StateActions.skillsStateUpdated({ skills })),
      catchError((error: Error) => this.handleErrors('Skills', error)),
    )),
  ));

  /**
   * Connects to social media information state to get page information.
   */
  public connectToSocialMediaInformationState = createEffect(() => this.actions.pipe(
    ofType(StateActions.socialMediaInformationStateConnect),
    switchMap(() => this.dbService.getDataArray<ISocialInfor>('social-infor-section').pipe(
      map((socialInfor: ISocialInfor[]) => StateActions
        .socialMediaInformationStateUpdated({ socialInfor })),
      catchError((error: Error) => this.handleErrors('Social media information state', error)),
    )),
  ));

  /**
   * Handle Erros
   * @param place where did this error occurs
   * @param error error
   * @returns empty observable
   */
  private handleErrors(place: string, error: Error): Observable<never> {
    console.log(`An error occured in [${place}] Error ${error}`);
    return EMPTY;
  }
}
