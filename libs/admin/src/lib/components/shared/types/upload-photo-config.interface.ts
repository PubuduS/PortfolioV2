/**
 * Configuration interface for the UploadPhotoComponent
 */
export interface IUploadPhotoConfig {
  /** Dialog title displayed in the upload dialog */
  title?: string;

  /** State selector function for retrieving current data from NgRx store */
  stateSelector?: any;

  /** State update action for dispatching changes to NgRx store */
  stateUpdateAction?: any;

  /** Field path for updating data in Firebase */
  fieldPath?: string;

  /** Current image URL to display in the preview */
  currentImageUrl?: string;

  /** Callback function called after successful image upload with the Firebase URL */
  onImageUploaded?: (imageUrl: string) => void;
}
