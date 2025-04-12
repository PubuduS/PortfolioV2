import { Injectable } from '@angular/core';
import {
  Auth,
  authState,
  signInWithEmailAndPassword,
  signOut,
  User,
} from '@angular/fire/auth';
import { Observable } from 'rxjs';
import { Store } from '@ngrx/store';
import { Router } from '@angular/router';

import { StateActions } from '@portfolio-v2/state';

/**
 *  Handle Authentication Operations
 */
@Injectable({
  providedIn: 'root',
})
export class AuthService {
  /** auth state */
  public readonly authState$: Observable<User | null>;

  /**
   * constructor
   * @param auth firebase auth
   * @param router Router
   * @param store ngrx store
   */
  constructor(
    private auth: Auth,
    private router: Router,
    private store: Store,
  ) {
    this.authState$ = authState(this.auth);
  }

  /**
   * Sign in to authenticate user
   * @param userName user name
   * @param password password
   * @returns true if successfull; false otherwise
   */
  public signIn(userName: string, password: string): Promise<boolean> {
    if (!this.isUserLoggedIn()) {
      return signInWithEmailAndPassword(this.auth, userName, password)
        .then((t) => {
          console.log(`t ${t.user.email}`);
          this.store.dispatch(StateActions.adminStateUpdated({ isAdmin: true }));
          this.router.navigate(['admin/landing']);
          return true;
        })
        .catch((error) => {
          const errorCode = error.code;
          const errorMessage = error;
          this.store.dispatch(StateActions.adminStateUpdated({ isAdmin: false }));
          // eslint-disable-next-line no-console
          console.log(`Error ${errorCode} - ${errorMessage}`);
          return false;
        });
    }
    return Promise.resolve(false);
  }

  /**
   * getUser
   * @returns currentUser if user is logged in; null otherwise
   */
  public getUser(): User | null {
    return this.auth.currentUser;
  }

  /**
   * isUserLoggedIn
   * @returns true if user is logged in; false otherwise
   */
  public isUserLoggedIn(): boolean {
    return !!this.getUser();
  }

  /**
   * logout the user
   * @returns convert promise returns by logout to observable of void
   */
  public logout(): Promise<void> {
    this.store.dispatch(StateActions.adminStateUpdated({ isAdmin: false }));
    return signOut(this.auth);
  }
}
