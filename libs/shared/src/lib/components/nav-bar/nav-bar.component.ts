import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  Signal,
  computed,
  signal,
} from '@angular/core';
import {
  RouterModule,
  RouterLink,
  Router,
} from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Store } from '@ngrx/store';

import {
  AuthService,
  DocumentCatalogReader,
} from '@portfolio-v2/shared/services';
import { StateActions } from '@portfolio-v2/state';
import {
  coverLetterNavTarget,
  resumeNavTarget,
  type CoverLetterNavTarget,
  type ResumeNavTarget,
} from '@portfolio-v2/state/dataModels';
import {
  isAdminModeSelector,
  isPreviewModeSelector,
  isPartyModeSelector,
} from '@portfolio-v2/state/selectors';
import { WeatherDisplayComponent } from '../weather-display/weather-display.component';
import {
  mirrorUrl,
  navSectionPaths,
  type NavSectionPaths,
} from './mirror-url';

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
  ],
  templateUrl: './nav-bar.component.html',
  styleUrl: './nav-bar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavBarComponent {
  /** Returns true if admin mode is on; false otherwise */
  protected readonly isAdminMode: Signal<boolean>;

  /** Returns true if preview mode is on; false otherwise */
  protected readonly isPreviewMode: Signal<boolean>;

  /** Returns true if party mode is on; false otherwise */
  protected readonly isPartyMode: Signal<boolean>;

  /** True while the compact navigation list is open. */
  protected readonly isMenuOpen = signal(false);

  /** Resume link for the current admin and preview flags. */
  protected readonly resumeTarget: Signal<ResumeNavTarget>;

  /** Cover letter link for the current admin and preview flags. */
  protected readonly coverLetterTarget: Signal<CoverLetterNavTarget>;

  /** Section links for the current admin and preview flags. */
  protected readonly sectionPath: Signal<NavSectionPaths>;

  /** True when the analytics link should show. */
  protected readonly showAnalytics: Signal<boolean>;

  /** Address to reopen when party mode is turned off. */
  private partyReturnUrl: string | null = null;

  /**
   * constructor
   * @param store ngrx store
   * @param authService auth Service
   * @param router Router
   * @param documents catalog reader for the visitor resume href
   * @param host host element, used to tell inside clicks from outside clicks
   */
  constructor(
    private store: Store,
    private authService: AuthService,
    private router: Router,
    private documents: DocumentCatalogReader,
    private host: ElementRef<HTMLElement>,
  ) {
    this.isAdminMode = this.store.selectSignal(isAdminModeSelector);
    this.isPreviewMode = this.store.selectSignal(isPreviewModeSelector);
    this.isPartyMode = this.store.selectSignal(isPartyModeSelector);
    this.resumeTarget = computed(() => resumeNavTarget(
      this.isAdminMode(),
      this.isPreviewMode(),
      this.documents.view('resume')(),
    ));
    this.coverLetterTarget = computed(() => coverLetterNavTarget(
      this.isAdminMode(),
      this.isPreviewMode(),
    ));
    this.sectionPath = computed(() => navSectionPaths(
      this.isAdminMode(),
      this.isPreviewMode(),
    ));
    this.showAnalytics = computed(() => this.isAdminMode() && !this.isPreviewMode());
  }

  /**
   * Close the compact navigation list.
   */
  protected closeMenu(): void {
    this.isMenuOpen.set(false);
  }

  /**
   * Close the compact list when Escape is pressed.
   */
  @HostListener('document:keydown.escape')
  protected closeMenuOnEscape(): void {
    this.closeMenu();
  }

  /**
   * Close the compact list when a press lands outside the bar.
   * @param event document click
   */
  @HostListener('document:click', ['$event'])
  protected closeMenuOnOutsideClick(event: Event): void {
    if (!this.isMenuOpen()) {
      return;
    }
    const { target } = event;
    if (target instanceof Node && this.host.nativeElement.contains(target)) {
      return;
    }
    this.closeMenu();
  }

  /**
   * Logout
   */
  protected logOut(): void {
    this.closeMenu();
    this.authService.logout();
  }

  /**
   * Toggle preview and admin modes while in admin mode.
   */
  protected togglePreview(): void {
    this.closeMenu();
    this.store.dispatch(
      StateActions.previewModeStateUpdated({ isPreviewMode: !this.isPreviewMode() }),
    );
    this.router.navigateByUrl(mirrorUrl(this.router.url));
  }

  /**
   * Open or close the compact navigation list.
   * @param event click on the menu button
   */
  protected toggleMenu(event: Event): void {
    event.stopPropagation();
    this.isMenuOpen.update((isOpen) => !isOpen);
  }

  /**
   * Toggle party mode, returning to the page it was opened from.
   */
  protected togglePartyMode(): void {
    this.closeMenu();
    const leaving = this.isPartyMode();
    if (!leaving) {
      this.partyReturnUrl = this.pageBeforePartyMode();
    }
    this.store.dispatch(
      StateActions.partyModeStateUpdated({ isPartyMode: !leaving }),
    );
    const target = leaving
      ? this.partyReturnUrl ?? this.sectionPath().about
      : '/content/party-mode';
    this.router.navigateByUrl(target);
  }

  /**
   * Address to restore after party mode.
   * The about page stands in when party mode is already open.
   * @returns the current address, unless it is the party page
   */
  private pageBeforePartyMode(): string {
    const { url } = this.router;
    const path = url.split(/[?#]/)[0];
    return path === '/content/party-mode' ? this.sectionPath().about : url;
  }
}
