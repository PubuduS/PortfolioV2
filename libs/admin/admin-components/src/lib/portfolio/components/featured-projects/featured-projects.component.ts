import {
  ChangeDetectionStrategy,
  Component,
  Signal,
} from '@angular/core';
import { Store } from '@ngrx/store';
import { CommonModule } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';

import { IProjectCard } from '@portfolio-v2/state/dataModels';
import {
  IconURLs,
  IconURLType,
} from '@portfolio-v2/const';
import {
  featuredProjectCardsSelector,
  newFeaturedProjectRecordIdSelector,
} from '@portfolio-v2/state/selectors';
import {
  UpdateDeleteButtonsComponent,
  AddPortfolioRecordComponent,
  ProjectCardType,
} from '@portfolio-v2/admin/shared/components';
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
   */
  constructor(
    public dialog: MatDialog,
    private store: Store,
  ) {
    this.featuredProjectCards = this.store.selectSignal(featuredProjectCardsSelector);
  }

  protected addNewRecord(): void {
    this.dialog.open(AddPortfolioRecordComponent, {
      autoFocus: 'first-tabbable',
      restoreFocus: true,
      width: '800px',
      data: {
        currentId: this.nextCardId(),
        heading: 'Default Heading',
        type: ProjectCardType.featured,
      },
    });
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
    this.dialog.open(ProjectCardsComponent, {
      autoFocus: 'first-tabbable',
      restoreFocus: true,
      width: '800px',
      data: { cardId: id, type: ProjectCardType.featured },
    });
  }

  /**
   * Open delete dialog
   * @param projectId project id
   */
  private openDeleteDialog(projectId: number): void {
    this.dialog.open(
      DeletePortfolioTileComponent,
      {
        autoFocus: 'first-tabbable',
        restoreFocus: true,
        width: '800px',
        data: { recordId: projectId, type: ProjectCardType.featured },
      },
    );
  }
}
