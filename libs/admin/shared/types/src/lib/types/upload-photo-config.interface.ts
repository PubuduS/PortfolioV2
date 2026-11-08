/**
 * Configuration interface for the UploadPhotoComponent
 */
export interface IUploadPhotoConfig {
  /** Dialog title displayed in the upload dialog */
  title?: string;

  /** Storage path for the uploaded file */
  fieldPath?: string;

  /** Current image URL to display in the preview */
  currentImageUrl?: string;

  /** Called with the download URL after the bytes are stored */
  onImageUploaded?: (imageUrl: string) => void;
}
