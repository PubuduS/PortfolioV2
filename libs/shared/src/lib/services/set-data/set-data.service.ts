import { Injectable } from '@angular/core';
import {
  ref,
  Storage,
  uploadBytes,
  uploadBytesResumable,
  deleteObject,
  getDownloadURL,
} from '@angular/fire/storage';
import {
  Firestore,
  doc,
  setDoc,
  deleteDoc,
  writeBatch,
  runTransaction,
} from '@angular/fire/firestore';
import {
  catchError,
  from,
  map,
  Observable,
  of,
} from 'rxjs';

import { AllowedRecords } from '../../types';

/** One document write inside a single batch. */
export type WriteOp =
  | { readonly kind: 'set'; readonly path: string; readonly value: AllowedRecords }
  | { readonly kind: 'delete'; readonly path: string };

/**
 * Recipe result for one transaction.
 * `next` null means do not call set. Business refusals are results, not thrown errors.
 */
export interface TransactionRecipe<T> {
  /** Document body to write. Null leaves the document untouched. */
  readonly next: { readonly [key: string]: unknown } | null;
  /** Value returned to the caller after the transaction commits. */
  readonly result: T;
}

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
    this.progressValue = 0;
    this.isUploadCompleted = false;

    const response = await fetch(fileUrl);
    const imageFile = await response.blob();
    const uploadTask = uploadBytesResumable(storageRef, imageFile);

    await new Promise<void>((resolve, reject) => {
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
          reject(error);
        },
        () => resolve(),
      );
    });
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
   * Modify a field in a record
   * @param path database path
   * @param value value to add
   * @param field field to modify
   * @returns observable doc reference
   */
  public modifyAField(path: string, value: string | undefined, field: string): Observable<string> {
    if (!value) {
      return of('empty');
    }
    const docRef = doc(this.firestore, path);
    return from(setDoc(docRef, { [field]: value }, { merge: true })).pipe(
      map(() => 'successfull'),
      catchError((error) => of(`error ${error}`)),
    );
  }

  /**
   * Modify image
   * @param path database path
   * @param value value to add
   * @returns observable doc reference
   */
  public modifyImageSrcField(path: string, value: string | undefined): Observable<string> {
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
  public setRecord<T extends AllowedRecords>(path: string, value: T): Observable<string> {
    if (!value) {
      return of('empty');
    }
    const docRef = doc(this.firestore, path);
    return from(setDoc(docRef, value)).pipe(
      map(() => 'successfull'),
      catchError((error) => of(`error ${error}`)),
    );
  }

  /**
   * Delete a record from Firestore
   * @param path database path
   * @returns observable doc reference
   */
  public deleteRecord(path: string): Observable<string> {
    const docRef = doc(this.firestore, path);
    return from(deleteDoc(docRef)).pipe(
      map(() => 'successfull'),
      catchError((error) => of(`error ${error}`)),
    );
  }

  /**
   * Apply document writes in one Firestore batch.
   * @param ops set and delete operations
   * @returns resolves when the batch commits
   */
  public async commit(ops: readonly WriteOp[]): Promise<void> {
    const batch = writeBatch(this.firestore);
    ops.forEach((op) => {
      const docRef = doc(this.firestore, op.path);
      switch (op.kind) {
        case 'set':
          batch.set(docRef, op.value);
          break;
        case 'delete':
          batch.delete(docRef);
          break;
        default: {
          const unexpected: never = op;
          throw new Error(`Unsupported write: ${JSON.stringify(unexpected)}`);
        }
      }
    });
    await batch.commit();
  }

  /**
   * Read one document and write it back inside a transaction.
   * A null `next` commits without calling set. The recipe must not throw for a business refusal.
   * @param path document path
   * @param recipe pure read of the current snapshot data
   * @returns the recipe result after the transaction commits
   */
  public async transact<T>(
    path: string,
    recipe: (current: unknown) => TransactionRecipe<T>,
  ): Promise<T> {
    const docRef = doc(this.firestore, path);
    return runTransaction(this.firestore, async (transaction) => {
      const snapshot = await transaction.get(docRef);
      const recipeResult = recipe(snapshot.data());
      if (recipeResult.next !== null) {
        transaction.set(docRef, recipeResult.next);
      }
      return recipeResult.result;
    });
  }

  /**
   * Upload a file and resolve with its download URL after the bytes are stored.
   * @param path storage path
   * @param file file to upload
   * @returns download URL
   */
  public async uploadFile(path: string, file: File): Promise<string> {
    const storageRef = ref(this.storage, path);
    await uploadBytes(storageRef, file);
    return getDownloadURL(storageRef);
  }

  /**
   * Delete file from firebase storage
   * @param filePath file path in storage
   * @returns Observable that returns success status
   */
  public deleteFileFromStorage(filePath: string): Observable<string> {
    const storageRef = ref(this.storage, filePath);
    return from(deleteObject(storageRef)).pipe(
      map(() => 'successfull'),
      catchError((error) => of(`error ${error}`)),
    );
  }
}
