import {
  Inject,
  Injectable,
  NgZone,
} from '@angular/core';
import {
  Auth,
  User,
  authState,
  getIdTokenResult,
  signInWithEmailAndPassword,
  signOut,
} from '@angular/fire/auth';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';

import { StateActions } from '@portfolio-v2/state';
import { AdminIdleSession } from './admin-idle-session';
import {
  AUTH_TARGET,
  AuthTarget,
  PASSWORD_SIGN_IN_PROVIDER,
  sessionMatchesAuthTarget,
} from './auth-target';

/**
 * Admin authentication for one Firebase Auth backend.
 * A live build rejects emulator sessions, and an emulator build rejects live sessions.
 */
@Injectable({
  providedIn: 'root',
})
export class AuthService {
  /** Auth state for the backend this build is connected to. */
  public readonly authState$: Observable<User | null>;

  /** True when the admin session is closing. */
  private closing = false;

  /** Session idle timeout. */
  private readonly idle: AdminIdleSession;

  /** True when the admin session is signing in. */
  private signingIn = false;

  /** Promise to verify the current user. */
  private verification: Promise<boolean> | null = null;

  /** UID of the verified user. */
  private verifiedUid: string | null = null;

  /**
   * constructor
   * @param auth Firebase Auth instance for this build.
   * @param router Router.
   * @param store NgRx store.
   * @param zone Angular zone. Activity listeners stay outside it.
   * @param authTarget Backend this build is allowed to trust.
   */
  constructor(
    private auth: Auth,
    private router: Router,
    private store: Store,
    private zone: NgZone,
    @Inject(AUTH_TARGET) private authTarget: AuthTarget,
  ) {
    this.authState$ = authState(this.auth);
    this.idle = new AdminIdleSession(() => {
      this.zone.run(() => {
        this.logout().catch(() => undefined);
      });
    });
    this.authState$.subscribe((user) => {
      this.reconcile(user).catch(() => undefined);
    });
  }

  /**
   * Current user on this Auth instance.
   * @returns The signed-in user, or null.
   */
  public getUser(): User | null {
    return this.auth.currentUser;
  }

  /**
   * Confirms the current user with a forced token refresh against this build's backend.
   * @returns True when the user may use the admin area.
   */
  public hasVerifiedAdminSession(): Promise<boolean> {
    if (
      this.verifiedUid
      && this.auth.currentUser?.uid === this.verifiedUid
      && this.backendMatchesTarget()
    ) {
      return Promise.resolve(true);
    }
    if (!this.verification) {
      this.verification = this.verifyCurrentUser().finally(() => {
        this.verification = null;
      });
    }
    return this.verification;
  }

  /**
   * True when Firebase currently has a user. This does not mean the user is an admin.
   * @returns True when `currentUser` is set.
   */
  public isUserLoggedIn(): boolean {
    return !!this.getUser();
  }

  /**
   * Ends the admin session and leaves the admin area.
   * @returns Resolves after the local session is cleared.
   */
  public async logout(): Promise<void> {
    this.closing = true;
    this.signingIn = false;
    this.clearPrivileges();
    try {
      await signOut(this.auth);
    } finally {
      await this.router.navigateByUrl('/home');
      this.closing = false;
    }
  }

  /**
   * Signs in against this build's Auth backend and opens the admin home when the session is valid.
   * @param userName Email address.
   * @param password Password.
   * @returns True when the session belongs to this backend.
   */
  public async signIn(userName: string, password: string): Promise<boolean> {
    this.signingIn = true;
    try {
      if (this.auth.currentUser) {
        this.clearPrivileges();
        await signOut(this.auth);
      }
      const credential = await signInWithEmailAndPassword(this.auth, userName, password);
      const trusted = await this.trust(credential.user);
      if (!trusted) {
        this.clearPrivileges();
        await signOut(this.auth);
        return false;
      }
      this.grantPrivileges(credential.user);
      await this.router.navigateByUrl('/admin/home');
      return true;
    } catch {
      this.clearPrivileges();
      return false;
    } finally {
      this.signingIn = false;
    }
  }

  /**
   * True when the current user's backend matches the build's target.
   * @returns True when the user's backend matches the build's target.
   */
  private backendMatchesTarget(): boolean {
    return sessionMatchesAuthTarget(this.authTarget, this.auth.emulatorConfig);
  }

  /**
   * Clears the admin privileges.
   */
  private clearPrivileges(): void {
    this.verifiedUid = null;
    this.idle.stop();
    this.store.dispatch(StateActions.adminStateUpdated({ isAdmin: false }));
    this.store.dispatch(StateActions.previewModeStateUpdated({ isPreviewMode: false }));
  }

  /**
   * Grants the admin privileges to the user.
   * @param user The user to grant privileges to.
   */
  private grantPrivileges(user: User): void {
    this.verifiedUid = user.uid;
    this.store.dispatch(StateActions.adminStateUpdated({ isAdmin: true }));
    this.zone.runOutsideAngular(() => {
      this.idle.start();
    });
  }

  /**
   * Reconciles the auth state with the current user.
   * @param user The current user.
   */
  private async reconcile(user: User | null): Promise<void> {
    if (this.signingIn || this.closing) {
      return;
    }
    if (!user) {
      const wasSignedIn = this.verifiedUid !== null;
      this.clearPrivileges();
      if (wasSignedIn) {
        await this.router.navigateByUrl('/home');
      }
      return;
    }
    await this.hasVerifiedAdminSession();
  }

  /**
   * True when the user's backend matches the build's target.
   * @param user The user to check.
   * @returns True when the user's backend matches the build's target.
   */
  private async trust(user: User): Promise<boolean> {
    if (!this.backendMatchesTarget()) {
      return false;
    }
    try {
      const result = await getIdTokenResult(user, true);
      return result.signInProvider === PASSWORD_SIGN_IN_PROVIDER && result.token.length > 0;
    } catch {
      return false;
    }
  }

  /**
   * Verifies the current user.
   * @returns True when the user is verified.
   */
  private async verifyCurrentUser(): Promise<boolean> {
    await this.auth.authStateReady();
    const current = this.auth.currentUser;
    if (!current) {
      this.clearPrivileges();
      return false;
    }
    const trusted = await this.trust(current);
    if (!trusted) {
      this.clearPrivileges();
      try {
        await signOut(this.auth);
      } catch {
        return false;
      }
      return false;
    }
    this.grantPrivileges(current);
    return true;
  }
}
