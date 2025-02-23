import * as _ from 'lodash';
import { Injectable } from '@angular/core';
import {
  map,
  Observable,
  of,
} from 'rxjs';
import {
  Firestore,
  collection,
  collectionData,
  doc,
  docData,
  orderBy,
  query,
} from '@angular/fire/firestore';
import { Storage } from '@angular/fire/storage';

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
} from '@portfolio-v2/interfaces';

/**
 * Get Data Searvice
 * TODO: These will soon move to database
 */
@Injectable({
  providedIn: 'root',
})
export class GetDataService {
  /** Holds publication detail card for now. todo: move this to ngrx state */
  public publicationDetailCard: Observable<IPublicationDetails | undefined> = of(undefined);

  /** Holds project card for now. todo: move this to ngrx state */
  public projectCard: Observable<IProjectCard | undefined> = of(undefined);

  /** Social information */
  private readonly socialInfor: ISocialInfor = {
    linkedin: 'https://www.linkedin.com/in/pubudu-wijesooriya/',
    github: 'https://github.com/PubuduS/',
    email: 'pubudusupun@gmail.com',
  };

  /**
   * constructor
   * @param storage angular fire storage
   * @param firestore firestore
   */
  constructor(
    private storage: Storage,
    private firestore: Firestore,
  ) {}

  /**
   * Get about me section data
   * @param location collection name
   * @returns Observable of IAboutMe
   */
  public getAboutMeSectionData(location: string): Observable<IAboutMe> {
    const cardCollection = collection(this.firestore, location);
    const orderedQuery = query(cardCollection, orderBy('id'));
    const aboutMeData = (collectionData(orderedQuery) as Observable<IAboutMe[]>).pipe(
      map((data) => data[0]),
      map((data) => ({
        ...data,
        intro: this.lineBreaker(typeof data.intro === 'string' ? data.intro : data.intro.join('')),
        leftPoints: this.lineBreaker(typeof data.leftPoints === 'string' ? data.leftPoints : data.leftPoints.join('')),
        rightPoints: this.lineBreaker(typeof data.rightPoints === 'string' ? data.rightPoints : data.rightPoints.join('')),
      })),
    );

    return aboutMeData;
  }

  /**
   * Get skills section data
   * @param location collection name
   * @returns Observable of IAboutMe
   */
  public getSkillsSectionData(location: string): Observable<ISkills> {
    const cardCollection = collection(this.firestore, location);
    const orderedQuery = query(cardCollection, orderBy('id'));
    const skillsData = (collectionData(orderedQuery) as Observable<ISkills[]>).pipe(
      map((data) => data[0]),
      map((data) => (
        {
          ...data,
          languagesCol1: this.createSkillMap(data.languagesCol1 as unknown as string),
          languagesCol2: this.createSkillMap(data.languagesCol2 as unknown as string),
          framework: this.lineBreaker(typeof data.framework === 'string' ? data.framework : data.framework.join('')),
          software: this.lineBreaker(typeof data.software === 'string' ? data.software : data.software.join('')),
        })),
    );

    return skillsData;
  }

  /**
   * Get experience section data
   * @param location collection name
   * @returns Observable of IAboutMe
   */
  public getExperienceSectionData(location: string): Observable<IExperience[]> {
    const cardCollection = collection(this.firestore, location);
    const orderedQuery = query(cardCollection, orderBy('id', 'desc'));
    const experienceData = (collectionData(orderedQuery) as Observable<IExperience[]>).pipe(
      map((data) => _.map(data, (exp: IExperience) => ({
        ...exp,
        startDate: new Date(exp.startDate),
        endDate: exp.endDate as unknown as string === 'present' ? new Date() : new Date(exp.endDate),
      }))),
    );
    return experienceData;
  }

  /**
   * Get project section icons and descriptions
   * @param location collection name
   * @returns Observable of IAboutMe
   */
  public getProjectView(location: string): Observable<IProjectView[]> {
    const cardCollection = collection(this.firestore, location);
    const orderedQuery = query(cardCollection, orderBy('id'));
    return (collectionData(orderedQuery) as Observable<IProjectView[]>);
  }

  /**
   * Get a specific project card by id
   * @param location location
   * @param id id
   * @returns observable of project card or undefined if no records were found.
   */
  public getProjectCardById(location: string, id: number): Observable<IProjectCard | undefined> {
    const recordId = `project-${id.toString().padStart(2, '0')}`;
    const documentRef = doc(this.firestore, `${location}/${recordId}`);
    const data = docData(documentRef) as Observable<IProjectCard | undefined>;
    this.projectCard = data;
    return data;
  }

  /**
   * Get education information
   * @param location location
   * @returns observable of IEducation array.
   */
  public getEducationInformation(location: string): Observable<IEducation[]> {
    const cardCollection = collection(this.firestore, location);
    const orderedQuery = query(cardCollection, orderBy('id', 'desc'));
    return (collectionData(orderedQuery) as Observable<IEducation[]>);
  }

  /**
   * Get certificates information
   * @param location location
   * @returns observable of ICertificateCard array.
   */
  public getCertificatesInformation(location: string): Observable<ICertificateCard[]> {
    const cardCollection = collection(this.firestore, location);
    const orderedQuery = query(cardCollection, orderBy('id', 'desc'));
    return (collectionData(orderedQuery) as Observable<ICertificateCard[]>);
  }

  /**
   * Get publications
   * @param location location
   * @returns Observable of IPublication array.
   */
  public getPublications(location: string): Observable<IPublication[]> {
    const cardCollection = collection(this.firestore, location);
    const orderedQuery = query(cardCollection, orderBy('id'));
    return (collectionData(orderedQuery) as Observable<IPublication[]>);
  }

  /**
   * Get a publication detail card by id
   * @param location location
   * @param id id
   * @returns observable of publication detail card or undefined if no records were found.
   */
  public getPublicationDetailsCardById(
    location: string,
    id: number,
  ): Observable<IPublicationDetails | undefined> {
    const recordId = `publication-${id.toString().padStart(2, '0')}`;
    const documentRef = doc(this.firestore, `${location}/${recordId}`);
    const data = docData(documentRef) as Observable<IPublicationDetails | undefined>;
    this.publicationDetailCard = data;
    return data;
  }

  /**
   * Getter for social media information
   * @returns social media information data model
   */
  public getSocialInfor(): ISocialInfor {
    return this.socialInfor;
  }

  /**
   * Get the whole string and break it based on the delimiter
   * @param content Content as a single string
   * @returns Array of strings(Paragraphs)
   */
  private lineBreaker(content: string): string[] {
    return content
    // Split the string at each delimiter
      .split('<<LEnd>>')
    // Trim whitespace from each paragraph
      .map((paragraph) => paragraph.trim())
    // Remove empty entries
      .filter((paragraph) => paragraph.length > 0);
  }

  /**
   * Get the string marked with delimiter and clean up the string.
   * Then create a map of Map<string, number>.
   * @param content Content as a single string
   * @returns Map of skill and progress bar value
   */
  private createSkillMap(content: string): Map<string, number> {
    const breakLines = this.lineBreaker(content).join('').split('$');
    const skillMap = new Map<string, number>();

    for (let i = 0; i < breakLines.length; i += 2) {
      skillMap.set(breakLines[i], Number(breakLines[i + 1]));
    }

    return skillMap;
  }
}
