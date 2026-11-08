import { TestBed } from '@angular/core/testing';
import {
  Auth,
  authState,
  getIdTokenResult,
  signInWithEmailAndPassword,
  signOut,
} from '@angular/fire/auth';
import {
  provideRouter,
  Router,
} from '@angular/router';
import { Store } from '@ngrx/store';
import { provideMockStore } from '@ngrx/store/testing';
import { User } from 'firebase/auth';
import { Subject } from 'rxjs';

import { StateActions } from '@portfolio-v2/state/actions';
import {
  ADMIN_IDLE_TIMEOUT_MS,
  AUTH_TARGET,
  AuthTarget,
} from './auth-target';
import { AuthService } from './auth.service';

jest.mock('@angular/fire/auth');

const mockUser = {
  uid: 'admin-id',
  email: 'admin@example.test',
} as User;

describe('AuthService', () => {
  let service: AuthService;
  let currentUser: User | null;
  let emulatorConfig: object | null;
  let users: Subject<User | null>;
  let store: Store;
  let router: Router;

  async function settle(): Promise<void> {
    await new Promise((resolve) => {
      setTimeout(resolve, 0);
    });
  }

  function configure(target: AuthTarget): void {
    jest.clearAllMocks();
    currentUser = null;
    emulatorConfig = target === 'emulator'
      ? { host: '127.0.0.1', port: 9099 }
      : null;
    users = new Subject<User | null>();
    (authState as jest.Mock).mockReturnValue(users.asObservable());
    (getIdTokenResult as jest.Mock).mockResolvedValue({
      token: 'verified-token',
      signInProvider: 'password',
    });
    (signOut as jest.Mock).mockImplementation(async () => {
      currentUser = null;
    });
    (signInWithEmailAndPassword as jest.Mock).mockImplementation(async () => {
      currentUser = mockUser;
      return { user: mockUser };
    });

    const auth = {
      get currentUser() {
        return currentUser;
      },
      get emulatorConfig() {
        return emulatorConfig;
      },
      authStateReady: jest.fn().mockResolvedValue(undefined),
    } as unknown as Auth;

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideMockStore(),
        { provide: Auth, useValue: auth },
        { provide: AUTH_TARGET, useValue: target },
      ],
    });
    router = TestBed.inject(Router);
    jest.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    store = TestBed.inject(Store);
    jest.spyOn(store, 'dispatch');
    service = TestBed.inject(AuthService);
  }

  afterEach(() => {
    jest.useRealTimers();
    users.complete();
  });

  describe('when this build uses the emulator', () => {
    beforeEach(() => {
      configure('emulator');
    });

    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    describe('when the password session is for the emulator', () => {
      it('should grant admin and open the admin home', async () => {
        await expect(service.signIn('admin@example.test', 'secret')).resolves.toBe(true);

        expect(getIdTokenResult).toHaveBeenCalledWith(mockUser, true);
        expect(store.dispatch).toHaveBeenCalledWith(
          StateActions.adminStateUpdated({ isAdmin: true }),
        );
        expect(router.navigateByUrl).toHaveBeenCalledWith('/admin/home');
        expect(service.isUserLoggedIn()).toBe(true);
      });

      it('should grant admin when that session is restored', async () => {
        currentUser = mockUser;
        users.next(mockUser);
        await settle();

        expect(getIdTokenResult).toHaveBeenCalledWith(mockUser, true);
        expect(store.dispatch).toHaveBeenCalledWith(
          StateActions.adminStateUpdated({ isAdmin: true }),
        );
      });
    });

    describe('when the password is rejected', () => {
      it('should leave admin off', async () => {
        (signInWithEmailAndPassword as jest.Mock).mockRejectedValue(new Error('auth/wrong-password'));

        await expect(service.signIn('admin@example.test', 'nope')).resolves.toBe(false);

        expect(store.dispatch).toHaveBeenCalledWith(
          StateActions.adminStateUpdated({ isAdmin: false }),
        );
        expect(router.navigateByUrl).not.toHaveBeenCalledWith('/admin/home');
      });
    });

    describe('when the token is not a password session', () => {
      it('should sign out and refuse admin', async () => {
        (getIdTokenResult as jest.Mock).mockResolvedValue({
          token: 'verified-token',
          signInProvider: 'google.com',
        });

        await expect(service.signIn('admin@example.test', 'secret')).resolves.toBe(false);

        expect(signOut).toHaveBeenCalled();
        expect(store.dispatch).not.toHaveBeenCalledWith(
          StateActions.adminStateUpdated({ isAdmin: true }),
        );
      });
    });

    describe('when the token refresh fails', () => {
      it('should refuse admin', async () => {
        (getIdTokenResult as jest.Mock).mockRejectedValue(new Error('auth/invalid-refresh-token'));

        await expect(service.signIn('admin@example.test', 'secret')).resolves.toBe(false);
        expect(service.getUser()).toBeNull();
      });
    });

    describe('when a live user is restored into the emulator build', () => {
      it('should sign that user out', async () => {
        emulatorConfig = null;
        currentUser = mockUser;
        users.next(mockUser);
        await settle();

        expect(signOut).toHaveBeenCalled();
        expect(store.dispatch).not.toHaveBeenCalledWith(
          StateActions.adminStateUpdated({ isAdmin: true }),
        );
      });
    });

    describe('when the admin logs out', () => {
      it('should clear privilege and leave the admin area', async () => {
        await service.signIn('admin@example.test', 'secret');

        await service.logout();

        expect(signOut).toHaveBeenCalled();
        expect(store.dispatch).toHaveBeenCalledWith(
          StateActions.adminStateUpdated({ isAdmin: false }),
        );
        expect(store.dispatch).toHaveBeenCalledWith(
          StateActions.previewModeStateUpdated({ isPreviewMode: false }),
        );
        expect(router.navigateByUrl).toHaveBeenCalledWith('/home');
      });
    });

    describe('when the admin is idle for five minutes', () => {
      it('should log out', async () => {
        jest.useFakeTimers();
        await service.signIn('admin@example.test', 'secret');

        await jest.advanceTimersByTimeAsync(ADMIN_IDLE_TIMEOUT_MS);

        expect(signOut).toHaveBeenCalled();
        expect(router.navigateByUrl).toHaveBeenCalledWith('/home');
      });
    });
  });

  describe('when this build uses the live project', () => {
    beforeEach(() => {
      configure('live');
    });

    describe('when an emulator user is presented', () => {
      it('should refuse the emulator session', async () => {
        emulatorConfig = { host: '127.0.0.1', port: 9099 };

        await expect(service.signIn('admin@example.test', 'secret')).resolves.toBe(false);

        expect(getIdTokenResult).not.toHaveBeenCalled();
        expect(signOut).toHaveBeenCalled();
        expect(store.dispatch).not.toHaveBeenCalledWith(
          StateActions.adminStateUpdated({ isAdmin: true }),
        );
      });
    });

    describe('when the live password session refreshes', () => {
      it('should grant admin', async () => {
        await expect(service.signIn('person@example.com', 'secret')).resolves.toBe(true);

        expect(getIdTokenResult).toHaveBeenCalledWith(mockUser, true);
        expect(store.dispatch).toHaveBeenCalledWith(
          StateActions.adminStateUpdated({ isAdmin: true }),
        );
      });
    });
  });
});
