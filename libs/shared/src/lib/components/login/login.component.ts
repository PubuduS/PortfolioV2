import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormGroup,
  ReactiveFormsModule,
  FormBuilder,
  Validators,
} from '@angular/forms';

import {
  IEmailValidatorMsgs,
  IPasswordValidatorMsgs,
} from '@portfolio-v2/state/dataModels';

/**
 * Admin Login Panel
 */
@Component({
  selector: 'portfolio-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent implements OnInit {
  /** Login form */
  protected loginForm!: FormGroup;

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
   * @param formBuilder form builder
   */
  constructor(
    private formBuilder: FormBuilder,
  ) {}

  /**
   * @inheritdoc
   */
  public ngOnInit(): void {
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
    });
  }

  /**
   * Login function
   */
  public login(): void {
    console.log('To Be implemented');
  }
}
