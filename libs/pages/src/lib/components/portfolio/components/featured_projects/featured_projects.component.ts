import {
  ChangeDetectionStrategy,
  Component,
  Signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';

import { IProjectCard } from '@portfolio-v2/state/dataModels';
import {
  IconURLs,
  IconURLType,
} from '@portfolio-v2/const';
import { featuredProjectCardsSelector } from '@portfolio-v2/state/selectors';

/** Featured project page */
@Component({
  selector: 'portfolio-v2-featured-projects',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './featured_projects.component.html',
  styleUrl: './featured_projects.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeaturedProjectsComponent {
  /** Icon URLS */
  public readonly icons: IconURLType = IconURLs;

  /** Featured project cards */
  public readonly featuredProjectCards: Signal<IProjectCard[] | undefined>;

  /**
   * constructor
   * @param store ngrx store
   */
  constructor(private store: Store) {
    this.featuredProjectCards = this.store.selectSignal(featuredProjectCardsSelector);
  }
}
