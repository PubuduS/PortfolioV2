import {
  ChangeDetectionStrategy,
  Component,
  Signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  RouterModule,
  RouterLink,
  Router,
} from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';

import { WeatherDisplayComponent } from '@portfolio-v2/shared/components';
import {
  isAdminModeSelector,
  isPreviewModeSelector,
  isPartyModeSelector,
} from '@portfolio-v2/state/selectors';
import { AuthService } from '@portfolio-v2/shared/services';
import { StateActions } from '@portfolio-v2/state';

/**
 * Navigation bar
 */
@Component({
  selector: 'portfolio-nav-bar',
  standalone: true,
  imports: [
    RouterModule,
    RouterLink,
    WeatherDisplayComponent,
    MatIconModule,
    MatButtonModule,
    CommonModule,
  ],
  templateUrl: './nav-bar.component.html',
  styleUrl: './nav-bar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavBarComponent {
  /** Returns true if admin mode is on; false otherwise */
  protected readonly isAdmin: Observable<boolean>;
  /** Returns true if preview mode is on; false otherwise */
  protected readonly isPreviewMode: Signal<boolean>;
  /** Returns true if party mode is on; false otherwise */
  protected readonly isPartyMode: Signal<boolean>;

  /**
   * constructor
   * @param store ngrx store
   * @param authService auth Service
   * @param router Router
   */
  constructor(
    private store: Store,
    private authService: AuthService,
    private router: Router,
  ) {
    this.isAdmin = this.store.select(isAdminModeSelector);
    this.isPreviewMode = this.store.selectSignal(isPreviewModeSelector);
    this.isPartyMode = this.store.selectSignal(isPartyModeSelector);
  }

  /**
   * Logout
   */
  protected logOut(): void {
    this.authService.logout();
  }

  /**
   * Toggle preview and admin modes while in admin mode.
   */
  protected togglePreview(): void {
    this.store.dispatch(
      StateActions.previewModeStateUpdated({ isPreviewMode: !this.isPreviewMode() }),
    );
    const currentURL = this.router.url;
    const isAdmin = this.isAdminRoute(currentURL);
    const lastSegment = currentURL.substring(currentURL.lastIndexOf('/') + 1);
    if (lastSegment === 'home') {
      const newRoute = isAdmin ? `${lastSegment}` : `admin/${lastSegment}`;
      this.router.navigate([newRoute]);
    } else {
      const newRoute = isAdmin ? `content/${lastSegment}` : `admin/${lastSegment}`;
      this.router.navigate([newRoute]);
    }
  }

  /**
   * Toggle Part Mode
   */
  protected togglePartyMode(): void {
    this.store.dispatch(
      StateActions.partyModeStateUpdated({ isPartyMode: !this.isPartyMode() }),
    );
    if (this.isPartyMode()) {
      this.router.navigate(['content/party-mode']);
    } else {
      this.router.navigate(['content/aboutme']);
    }
  }

  /**
   * Chack if the current route is admin route
   * @param currentURL current URL
   * @returns true if the current route is admin; false otherwise
   */
  private isAdminRoute(currentURL: string): boolean {
    return currentURL.includes('admin');
  }
}
