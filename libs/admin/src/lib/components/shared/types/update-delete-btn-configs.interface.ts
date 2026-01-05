/**
 * Configuration interface
 * for the UpdateDeleteButtonsComponent
 */
export interface IUpdateDeleteBtnConfigs {
  /** Whether the buttons should be displayed in a vertical layout */
  isVerticalLayout: boolean;
  /** Whether the delete button should be disabled */
  deleteButtonDisabled?: boolean;
  /** Callback function called when the delete button is clicked */
  deleteButtonClick?: () => void;
  /** Whether the edit button should be disabled */
  editButtonDisabled?: boolean;
  /** Callback function called when the edit button is clicked */
  editButtonClick?: () => void;
}
