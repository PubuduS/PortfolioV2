import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  Type,
  ViewContainerRef,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { Store } from '@ngrx/store';

import { UpdateDeleteButtonsComponent } from '@portfolio-v2/admin/shared/components';
import { IUpdateDeleteBtnConfigs } from '@portfolio-v2/admin/shared/types';
import { StateActions } from '@portfolio-v2/state';
import { IEducation } from '@portfolio-v2/state/dataModels';
import {
  educationSelector,
  nextEducationIdSelector,
} from '@portfolio-v2/state/selectors';
import { DegreeDialogComponent } from './components/degree-dialog/degree-dialog.component';
import { DeleteDegreeDialogComponent } from './components/delete-degree-dialog/delete-degree-dialog.component';

/**
 * Admin list of degrees.
 */
@Component({
  selector: 'admin-degrees',
  standalone: true,
  imports: [
    MatButtonModule,
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
   * @inheritdoc
   */
  public ngOnInit(): void {
    this.store.dispatch(StateActions.educationCardsStateConnect());
  }

  /**
   * Open a dialog for the next degree id.
   */
  protected addDegree(): void {
    this.openDialog(DegreeDialogComponent, { mode: 'new', id: this.nextId() });
  }

  /**
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
    this.openDialog(DeleteDegreeDialogComponent, degree);
  }

  /**
   * Open a dialog for an existing degree.
   * @param degree record to edit
   */
  protected editDegree(degree: IEducation): void {
    this.openDialog(DegreeDialogComponent, { mode: 'edit', education: degree });
  }

  /**
   * Open a dialog in this page's injector so it can see the route writer.
   * @param component dialog type
   * @param data record or editor target
   */
  private openDialog<T, D>(component: Type<T>, data: D): void {
    this.dialog.open(component, {
      autoFocus: 'first-tabbable',
      restoreFocus: true,
      width: '800px',
      viewContainerRef: this.viewContainerRef,
      data,
    });
  }
}
