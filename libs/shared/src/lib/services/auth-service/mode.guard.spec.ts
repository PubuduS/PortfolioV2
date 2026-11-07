import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  provideRouter,
  Router,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import {
  MockStore,
  provideMockStore,
} from '@ngrx/store/testing';

import {
  isAdminModeSelector,
  isPreviewModeSelector,
} from '@portfolio-v2/state/selectors';
import { modeGuard } from './mode.guard';

describe('modeGuard', () => {
  let store: MockStore;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideMockStore(),
      ],
    });
    store = TestBed.inject(MockStore);
    store.overrideSelector(isAdminModeSelector, false);
    store.overrideSelector(isPreviewModeSelector, false);
  });

  /**
   * Run the guard for a URL.
   * @param url router url
   * @returns The guard result.
   */
  function activate(url: string): boolean | UrlTree {
    store.refreshState();
    return TestBed.runInInjectionContext(() => modeGuard(
      {} as ActivatedRouteSnapshot,
      { url } as RouterStateSnapshot,
    )) as boolean | UrlTree;
  }

  describe('when the visitor is not an admin', () => {
    it('should allow the public page', () => {
      expect(activate('/content/skills')).toBe(true);
    });
  });

  describe('when the admin is not previewing', () => {
    beforeEach(() => {
      store.overrideSelector(isAdminModeSelector, true);
    });

    it('should send a public page to its admin page', () => {
      expect(activate('/content/skills')).toEqual(TestBed.inject(Router).parseUrl('/admin/skills'));
    });

    it('should allow the admin page', () => {
      expect(activate('/admin/skills')).toBe(true);
    });
  });

  describe('when preview is on', () => {
    beforeEach(() => {
      store.overrideSelector(isAdminModeSelector, true);
      store.overrideSelector(isPreviewModeSelector, true);
    });

    it('should send an admin page to its public page', () => {
      expect(activate('/admin/aboutme')).toEqual(TestBed.inject(Router).parseUrl('/content/aboutme'));
    });

    it('should allow the public page', () => {
      expect(activate('/content/aboutme')).toBe(true);
    });
  });
});
