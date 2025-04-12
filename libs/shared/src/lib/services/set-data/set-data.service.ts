import { Injectable } from '@angular/core';
import {
  ref,
  Storage,
  uploadBytesResumable,
} from '@angular/fire/storage';

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
   * @param cdr change detection
   */
  constructor(
    private storage: Storage,
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
}
