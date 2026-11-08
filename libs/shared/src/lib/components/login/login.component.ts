import {
  ChangeDetectionStrategy,
  Component,
  signal,
} from '@angular/core';
import {
  email,
  form,
  FormField,
  required,
  submit,
} from '@angular/forms/signals';

import {
  IEmailValidatorMsgs,
  IPasswordValidatorMsgs,
} from '@portfolio-v2/state/dataModels';
import { AuthService } from '@portfolio-v2/shared/services';

/** Email and password entered on the sign-in form. */
interface LoginValues {
  /** Email address. */
  email: string;
  /** Password. */
  password: string;
}

/**
 * Admin Login Panel
 */
@Component({
  selector: 'portfolio-login',
  standalone: true,
  imports: [FormField],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
  /** Email and password the visitor typed. */
  private readonly loginModel = signal<LoginValues>({
    email: '',
    password: '',
  });

  /** Login form */
  protected readonly loginForm = form(this.loginModel, (fields) => {
    required(fields.email);
    email(fields.email);
    required(fields.password);
  });

  /** True until a sign-in attempt is rejected. */
  protected readonly isCredentialsRight = signal(true);

  /** Email validator messages */
  protected readonly emailValidatorMsgs: IEmailValidatorMsgs = {
    emailReqError: 'Please enter an email address.',
    emailPttrnError: 'Please enter a valid email address.',
  };

  /** password validator messages */
  protected readonly passwordValidatorMsgs: IPasswordValidatorMsgs = {
    passwordReqError: 'Please enter a password.',
  };

  /**
   * constructor
   * @param authService auth service
   */
  constructor(
    private authService: AuthService,
  ) {}

  /**
   * Login function
   */
  public async login(): Promise<void> {
    await submit(this.loginForm, async () => {
      const { email: address, password } = this.loginForm().value();
      const accepted = await this.authService.signIn(address, password);
      this.isCredentialsRight.set(accepted);
      if (!accepted) {
        this.loginForm().reset({
          email: '',
          password: '',
        });
      }
      return undefined;
    });
  }
}
