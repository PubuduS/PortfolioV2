import { TestBed } from '@angular/core/testing';
import { createSpyObj } from 'jest-createspyobj';
import {
  Auth,
  authState,
} from '@angular/fire/auth';
import { User } from 'firebase/auth';
import { of } from 'rxjs';
import { provideMockStore } from '@ngrx/store/testing';

import { AuthService } from './auth.service';

jest.mock('@angular/fire/auth');

describe('AuthService', () => {
  let service: AuthService;
  let auth: jest.Mocked<Auth>;
  const mockUser: User = {
    uid: 'test-user-id',
    email: 'test@example.com',
  } as User;

  beforeEach(() => {
    auth = createSpyObj(Auth);
    (authState as jest.Mock).mockReturnValue(of(mockUser));

    TestBed.configureTestingModule({
      declarations: [],
      providers: [
        provideMockStore(),
        {
          provide: Auth,
          useValue: auth,
        },
      ],
    });
    service = TestBed.inject(AuthService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
