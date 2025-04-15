import { Injectable } from '@angular/core';
import {
  ref,
  Storage,
  uploadBytesResumable,
} from '@angular/fire/storage';
import {
  Firestore,
  doc,
  setDoc,
} from '@angular/fire/firestore';
import {
  catchError,
  from,
  map,
  Observable,
  of,
} from 'rxjs';

import { IAboutMe } from '@portfolio-v2/state/dataModels';

/**
 * Set/Modify Data in the database
 */
@Injectable({
  providedIn: 'root',
})
export class SetDataService {
  /** Upload Progress Value */
  private progressValue = 0;
  /** Upload Complete Status */
  private isUploadCompleted = false;

  /**
   * constructor
   * @param storage firebase storage
   * @param firestore firestore
   */
  constructor(
    private storage: Storage,
    private firestore: Firestore,
  ) {}

  /**
   * Push file to firebase storage bucket
   * @param fileDBPath file path in the database
   * @param fileUrl file URL
   * @returns Promise that returns nothing
   */
  public async pushFileToStorage(fileDBPath: string, fileUrl: string): Promise<void> {
    const storageRef = ref(this.storage, fileDBPath);

    const response = await fetch(fileUrl);
    const imageFile = await response.blob();
    const uploadTask = uploadBytesResumable(storageRef, imageFile);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        // Observe state change events such as progress, pause, and resume
        // Get task progress, including the number of bytes uploaded and
        // the total number of bytes to be uploaded
        this.progressValue = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        this.isUploadCompleted = this.progressValue === 100;
      },
      (error) => {
        console.log(`error ${error}`);
      },
    );
  }

  /**
   * Get the upload progress value
   * @returns progress value
   */
  public getProgressValue(): number {
    return this.progressValue;
  }

  /**
   * Get the upload completed state
   * @returns true if upload is completed; false otherwise.
   */
  public getUploadCompleteState(): boolean {
    return this.isUploadCompleted;
  }

  /**
   * Modify image
   * @param path database path
   * @param value value to add
   * @returns observable doc reference
   */
  public modifyField(path: string, value: string | undefined): Observable<string> {
    if (!value) {
      return of('empty');
    }
    const docRef = doc(this.firestore, path);
    return from(setDoc(docRef, { imageSrc: value }, { merge: true })).pipe(
      map(() => 'successfull'),
      catchError((error) => of(`error ${error}`)),
    );
  }

  /**
   * Replace a record with new value
   * @param path database path
   * @param value value to add
   * @returns observable doc reference
   */
  public setRecord(path: string, value: IAboutMe): Observable<string> {
    if (!value) {
      return of('empty');
    }
    const docRef = doc(this.firestore, path);
    return from(setDoc(docRef, value)).pipe(
      map(() => 'successfull'),
      catchError((error) => of(`error ${error}`)),
    );
  }
}
