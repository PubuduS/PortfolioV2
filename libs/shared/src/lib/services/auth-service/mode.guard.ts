import { inject } from '@angular/core';
import {
  CanActivateFn,
  Router,
  UrlTree,
} from '@angular/router';
import { Store } from '@ngrx/store';
import { take } from 'rxjs';

import {
  isAdminModeSelector,
  isPreviewModeSelector,
} from '@portfolio-v2/state/selectors';
import { modeUrl } from '../../components/nav-bar/mirror-url';

/**
 * Read one selector without leaving a subscription.
 * @param store ngrx store
 * @param selector selector
 * @returns The current value.
 */
function selected<T>(store: Store, selector: (state: object) => T): T {
  let value!: T;
  store.select(selector).pipe(take(1)).subscribe((next) => {
    value = next;
  });
  return value;
}

/**
 * Keeps a signed-in admin on the admin pages until they turn preview on.
 * Preview mode stays on the public pages. Visitors are unchanged.
 * @param _route Activated route. Unused.
 * @param state Target navigation.
 * @returns True when the URL matches the mode, or a redirect to the matching page.
 */
export const modeGuard: CanActivateFn = (_route, state): boolean | UrlTree => {
  const store = inject(Store);
  if (!selected(store, isAdminModeSelector)) {
    return true;
  }
  const target = modeUrl(state.url, selected(store, isPreviewModeSelector));
  if (target === null) {
    return true;
  }
  return inject(Router).parseUrl(target);
};
