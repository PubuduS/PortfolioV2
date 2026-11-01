import {
  ComponentFixture,
  TestBed,
} from '@angular/core/testing';
import { createSpyObj } from 'jest-createspyobj';

import { AuthService } from '@portfolio-v2/shared/services';
import { LoginComponent } from './login.component';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let mockAuthService: jest.Mocked<AuthService>;

  beforeEach(async () => {
    mockAuthService = createSpyObj(AuthService);
    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('when the form is submitted', () => {
    it('should sign in with the entered email and password', async () => {
      mockAuthService.signIn.mockResolvedValue(true);
      const nativeElement = fixture.nativeElement as HTMLElement;
      const email = nativeElement.querySelector<HTMLInputElement>('input[placeholder="Email"]');
      const password = nativeElement.querySelector<HTMLInputElement>('input[placeholder="Password"]');
      if (!email || !password) {
        throw new Error('login fields missing');
      }
      email.value = 'admin@example.test';
      email.dispatchEvent(new Event('input'));
      password.value = 'secret';
      password.dispatchEvent(new Event('input'));
      fixture.detectChanges();

      await component.login();

      expect(mockAuthService.signIn).toHaveBeenCalledWith('admin@example.test', 'secret');
      expect(mockAuthService.logout).not.toHaveBeenCalled();
    });
  });
});
