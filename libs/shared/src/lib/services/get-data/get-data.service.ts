import * as _ from 'lodash';
import { Injectable } from '@angular/core';
import {
  map,
  Observable,
  of,
  from,
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
import {
  Storage,
  getDownloadURL,
  ref,
} from '@angular/fire/storage';

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

/** Custom Data */
type CustomData = IAboutMe | ICertificateCard | IEducation | IExperience |
IProjectView | IPublication | ISkills | ISocialInfor;

/**
 * Get Data Searvice
 */
@Injectable({
  providedIn: 'root',
})
export class GetDataService {
  /** Holds publication detail card for now. todo: move this to ngrx state */
  public publicationDetailCard: Observable<IPublicationDetails | undefined> = of(undefined);

  /** Holds project card for now. todo: move this to ngrx state */
  public projectCard: Observable<IProjectCard | undefined> = of(undefined);

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
   * Get data from database
   * @param location location
   * @param isAscending sort order. If true data will be return in ascending order
   * @returns Observable of data
   */
  public getData<T extends CustomData>(
    location: string,
    isAscending = true,
  ): Observable<T> {
    const cardCollection = collection(this.firestore, location);
    const orderedQuery = isAscending ? query(cardCollection, orderBy('id')) : query(cardCollection, orderBy('id', 'desc'));
    const singleRecord = (collectionData(orderedQuery) as Observable<T[]>).pipe(
      map((data) => data[0]),
    );

    return singleRecord;
  }

  /**
   * Get data from database
   * @param location location
   * @param isAscending sort order. If true data will be return in ascending order
   * @returns Observable of data array
   */
  public getDataArray<T extends CustomData>(
    location: string,
    isAscending = true,
  ): Observable<T[]> {
    const cardCollection = collection(this.firestore, location);
    const orderedQuery = isAscending ? query(cardCollection, orderBy('id')) : query(cardCollection, orderBy('id', 'desc'));
    const arrayOfRecords = (collectionData(orderedQuery) as Observable<T[]>);
    return arrayOfRecords;
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
   * Get a single URL to a photo stored in db, given a file path.
   * @param filePath file path
   * @returns observable containing the url of the photo
   */
  public getPhotoURL(filePath: string): Observable<string> {
    const fileRef = ref(this.storage, filePath);
    return from(getDownloadURL(fileRef));
  }
}
