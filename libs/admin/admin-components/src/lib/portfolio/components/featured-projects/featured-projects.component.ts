import {
  ChangeDetectionStrategy,
  Component,
  Signal,
  ViewContainerRef,
} from '@angular/core';
import { Store } from '@ngrx/store';
import { CommonModule } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';

import { IProjectCard } from '@portfolio-v2/state/dataModels';
import {
  IconURLs,
  IconURLType,
} from '@portfolio-v2/const';
import { StateActions } from '@portfolio-v2/state';
import {
  featuredProjectCardsSelector,
  newFeaturedProjectRecordIdSelector,
} from '@portfolio-v2/state/selectors';
import {
  openAdminDialog,
  UpdateDeleteButtonsComponent,
  ProjectCardType,
} from '@portfolio-v2/admin/shared/components';
import { ProjectLinkIconComponent } from '@portfolio-v2/portfolio-pages/project-link-icon';
import { AddPortfolioRecordComponent } from '../../add-portfolio-record/add-portfolio-record.component';
import { ProjectCardsComponent } from '../project-cards/project-cards.component';
import { DeletePortfolioTileComponent } from '../delete-portfolio-tile/delete-portfolio-tile.component';

/**
 * Featured projects component
 */
@Component({
  selector: 'admin-featured-projects',
  imports: [
    CommonModule,
    UpdateDeleteButtonsComponent,
    ProjectLinkIconComponent,
  ],
  templateUrl: './featured-projects.component.html',
  styleUrl: './featured-projects.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeaturedProjectsComponent {
  /** Icon URLS */
  public readonly icons: IconURLType = IconURLs;

  /** Featured project cards */
  public readonly featuredProjectCards: Signal<IProjectCard[] | undefined>;

  /** Current card id */
  private readonly nextCardId = this.store.selectSignal(newFeaturedProjectRecordIdSelector);

  /**
   * constructor
   * @param dialog dialog
   * @param store ngrx store
   * @param viewContainerRef view that can see the route writer
   */
  constructor(
    public dialog: MatDialog,
    private store: Store,
    private viewContainerRef: ViewContainerRef,
  ) {
    this.store.dispatch(StateActions.featuredProjectCardsStateConnect());
    this.featuredProjectCards = this.store.selectSignal(featuredProjectCardsSelector);
  }

  /**
   * Open a dialog for a new featured project.
   */
  protected addNewRecord(): void {
    openAdminDialog(this.dialog, this.viewContainerRef, AddPortfolioRecordComponent, {
      currentId: this.nextCardId(),
      heading: 'Default Heading',
      type: ProjectCardType.featured,
    }, '800px');
  }

  /**
   * Handle delete button click
   * @param project project to delete
   */
  protected onDeleteButtonClick(project: IProjectCard): void {
    this.openDeleteDialog(project.id);
  }

  /**
   * Handle edit button click
   * @param projectId project id to edit
   */
  protected onEditButtonClick(projectId: number): void {
    this.openProjectCardEditDialog(projectId);
  }

  /**
   * Open project card dialog
   * @param id project id
   */
  private openProjectCardEditDialog(id: number): void {
    openAdminDialog(
      this.dialog,
      this.viewContainerRef,
      ProjectCardsComponent,
      { cardId: id, type: ProjectCardType.featured },
      '800px',
    );
  }

  /**
   * Open delete dialog
   * @param projectId project id
   */
  private openDeleteDialog(projectId: number): void {
    openAdminDialog(
      this.dialog,
      this.viewContainerRef,
      DeletePortfolioTileComponent,
      { recordId: projectId, type: ProjectCardType.featured },
      '800px',
    );
  }
}
