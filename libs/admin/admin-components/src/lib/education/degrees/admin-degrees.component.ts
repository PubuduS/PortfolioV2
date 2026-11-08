import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  ViewContainerRef,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Store } from '@ngrx/store';

import {
  AddRecordComponent,
  AdminDeleteDialogComponent,
  AdminRecordDialogComponent,
  openAdminDialog,
  UpdateDeleteButtonsComponent,
} from '@portfolio-v2/admin/shared/components';
import { IUpdateDeleteBtnConfigs } from '@portfolio-v2/admin/shared/types';
import { StateActions } from '@portfolio-v2/state';
import {
  type EducationEditTarget,
  IEducation,
} from '@portfolio-v2/state/dataModels';
import {
  educationSelector,
  nextEducationIdSelector,
} from '@portfolio-v2/state/selectors';
import { DegreeFormComponent } from './components/degree-form/degree-form.component';
import {
  degreeWriteMessage,
  DegreeWriter,
} from './services/degree-writer.service';

/**
 * Admin list of degrees.
 */
@Component({
  selector: 'admin-degrees',
  standalone: true,
  imports: [
    AddRecordComponent,
    UpdateDeleteButtonsComponent,
  ],
  templateUrl: './admin-degrees.component.html',
  styleUrl: './admin-degrees.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminDegreesComponent implements OnInit {
  /** Application store. */
  private readonly store = inject(Store);

  /** Opens the add, edit and delete dialogs. */
  private readonly dialog = inject(MatDialog);

  /** View container the dialogs attach to, so they see this route's writer. */
  private readonly viewContainerRef = inject(ViewContainerRef);

  /** Stored degrees, newest first. */
  protected readonly degrees = this.store.selectSignal(educationSelector);

  /** Id a new degree would get. */
  private readonly nextId = this.store.selectSignal(nextEducationIdSelector);

  /**
   * Connect the store to the degree collection.
   * @inheritdoc
   */
  public ngOnInit(): void {
    this.store.dispatch(StateActions.educationCardsStateConnect());
  }

  /**
   * Open a dialog for the next degree id.
   */
  protected addDegree(): void {
    this.openRecordDialog('New degree', { mode: 'new', id: this.nextId() });
  }

  /**
   * Build the edit and delete actions for one degree.
   * @param degree record the buttons belong to
   * @returns button configuration
   */
  protected buttonConfig(degree: IEducation): IUpdateDeleteBtnConfigs {
    return {
      isVerticalLayout: false,
      deleteButtonDisabled: false,
      editButtonDisabled: false,
      deleteButtonClick: () => this.deleteDegree(degree),
      editButtonClick: () => this.editDegree(degree),
    };
  }

  /**
   * Open the confirmation dialog. The dialog removes the degree after confirmation.
   * @param degree record to remove
   */
  protected deleteDegree(degree: IEducation): void {
    openAdminDialog(this.dialog, this.viewContainerRef, AdminDeleteDialogComponent, {
      title: 'Delete degree',
      lines: [degree.title, degree.degree],
      record: degree,
      writer: DegreeWriter,
      writeMessage: degreeWriteMessage,
    }, '800px');
  }

  /**
   * Open a dialog for an existing degree.
   * @param degree record to edit
   */
  protected editDegree(degree: IEducation): void {
    this.openRecordDialog('Edit degree', { mode: 'edit', education: degree });
  }

  /**
   * Open the shared record dialog for a new or existing degree.
   * @param heading dialog title
   * @param target record the form loads
   */
  private openRecordDialog(heading: string, target: EducationEditTarget): void {
    openAdminDialog(this.dialog, this.viewContainerRef, AdminRecordDialogComponent, {
      heading,
      target,
      form: DegreeFormComponent,
      writer: DegreeWriter,
      writeMessage: degreeWriteMessage,
    }, '800px');
  }
}
