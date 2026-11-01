import { inject } from '@angular/core';
import {
  CanActivateFn,
  Router,
  UrlTree,
} from '@angular/router';

import { AuthService } from './auth.service';

/**
 * Blocks admin routes until this build's Auth backend has a verified password session.
 * @returns True when the session is valid, or a redirect to the login page.
 */
export const adminGuard: CanActivateFn = async (): Promise<boolean | UrlTree> => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const allowed = await auth.hasVerifiedAdminSession();
  if (allowed) {
    return true;
  }
  return router.createUrlTree(['/content/admin']);
};
