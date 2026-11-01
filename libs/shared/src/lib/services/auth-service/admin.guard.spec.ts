import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  provideRouter,
  Router,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';

import { adminGuard } from './admin.guard';
import { AuthService } from './auth.service';

describe('adminGuard', () => {
  let hasVerifiedAdminSession: jest.Mock<Promise<boolean>, []>;

  beforeEach(() => {
    hasVerifiedAdminSession = jest.fn();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: { hasVerifiedAdminSession },
        },
      ],
    });
  });

  function activate(): Promise<boolean | UrlTree> {
    return TestBed.runInInjectionContext(() => adminGuard(
      {} as ActivatedRouteSnapshot,
      {} as RouterStateSnapshot,
    )) as Promise<boolean | UrlTree>;
  }

  describe('when the session belongs to this auth backend', () => {
    it('should allow the admin route', async () => {
      hasVerifiedAdminSession.mockResolvedValue(true);

      await expect(activate()).resolves.toBe(true);
    });
  });

  describe('when the session is missing or from the other backend', () => {
    it('should redirect to the login page', async () => {
      hasVerifiedAdminSession.mockResolvedValue(false);

      const result = await activate();

      expect(result).toEqual(TestBed.inject(Router).createUrlTree(['/content/admin']));
    });
  });
});
