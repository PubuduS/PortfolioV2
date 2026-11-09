import * as _ from 'lodash';
import { Injectable } from '@angular/core';
import {
  from,
  map,
  Observable,
} from 'rxjs';
import {
  Firestore,
  collection,
  collectionData,
  orderBy,
  query,
} from '@angular/fire/firestore';
import {
  Storage,
  getBlob,
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
  ISocialInfo,
} from '@portfolio-v2/state/dataModels';
import { GetDateTimeService } from './get-date-time.service';

/** Custom Data */
type CustomData = IAboutMe | ICertificateCard | IEducation | IExperience |
IProjectView | IPublication | ISkills | ISocialInfo | IProjectCard | IPublicationDetails;

/**
 * Get Data Searvice
 */
@Injectable({
  providedIn: 'root',
})
export class GetDataService {
  /**
   * constructor
   * @param storage angular fire storage
   * @param firestore firestore
   * @param dateTimeService date time service
   */
  constructor(
    private storage: Storage,
    private firestore: Firestore,
    private dateTimeService: GetDateTimeService,
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
      map((data) => _.map(data, (exp: IExperience) => this.withCurrentEnd(exp))),
    );
    return experienceData;
  }

  /**
   * Read one storage object as bytes.
   * @param storagePath bucket-relative path
   * @returns file bytes
   */
  public async getFileBytes(storagePath: string): Promise<ArrayBuffer> {
    const fileRef = ref(this.storage, storagePath);
    const blob = await getBlob(fileRef);
    return blob.arrayBuffer();
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

  /**
   * A current job stores `present`. Show today's year without writing it back.
   * @param job stored job
   * @returns the job, with today's end date and year when it is current
   */
  private withCurrentEnd(job: IExperience): IExperience {
    if (job.endDate !== 'present') {
      return job;
    }
    const today = this.dateTimeService.convertDateToISOString(new Date());
    const year = today.slice(0, 4);
    const separator = job.timePeriod.indexOf('-');
    const timePeriod = separator === -1
      ? job.timePeriod
      : `${job.timePeriod.slice(0, separator).trimEnd()} - ${year}`;
    return {
      ...job,
      endDate: today,
      timePeriod,
    };
  }
}
