import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormGroup,
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs';

import { GetDataService } from '@portfolio-v2/shared/services';
import {
  ISocialInfor,
  IEmailValidatorMsgs,
  ISenderNameValidatorMsgs,
  IMessageValidatorMsgs,
} from '@portfolio-v2/interfaces';
import { ContactPopupComponent } from './components/contact_popup/contact_popup.component';

/**
 * Contact page
 */
@Component({
  selector: 'portfolio-v2-contact',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContactComponent implements OnInit {
  /** Contact form */
  protected contactForm!: FormGroup;

  /** Social infor */
  protected readonly socialInfor: Observable<ISocialInfor[]>;

  /** Name minimum length */
  protected readonly nameMinLen: number = 2;

  /** Name maximum length */
  protected readonly nameMaxLen: number = 12;

  /** Name regex pattern */
  protected readonly nameRegexPattern: string = '^[a-zA-Z]+$';

  /** Message minimum length */
  protected readonly msgMinLen: number = 10;

  /** Message maximum length */
  protected readonly msgMaxLen: number = 1000;

  /** Email validator messages */
  protected readonly emailValidatorMsgs: IEmailValidatorMsgs = {
    emailReqError: 'Please enter an email address.',
    emailPttrnError: 'Please enter a valid email address.',
  };

  /** Sender text field validator messages */
  protected readonly senderValidatorMsgs: ISenderNameValidatorMsgs = {
    senderReqError: 'Please enter your name.',
    senderMinLenError: `A name should have at least ${this.nameMinLen} letters.`,
    senderMaxLenError: `A name should not exceed ${this.nameMaxLen} letters.`,
    senderPttrnError: 'The name can only contain letters.',
  };

  /** Message text field validator messages */
  protected readonly msgValidatorMsgs: IMessageValidatorMsgs = {
    msgReqError: 'Please enter a message.',
    msgMinLenError: `The message should have at least ${this.msgMinLen} letters.`,
    msgMaxLenError: `The message should not exceed ${this.msgMaxLen} characters.`,
  };

  /**
   * constructor
   * @param dataService data service
   * @param dialog dialog
   * @param formBuilder form builder
   */
  constructor(
    private dataService: GetDataService,
    private dialog: MatDialog,
    private formBuilder: FormBuilder,
  ) {
    this.socialInfor = this.dataService.getDataArray<ISocialInfor>('social-infor-section');
  }

  /**
   * @inheritdoc
   */
  public ngOnInit(): void {
    this.contactForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      name: ['', [Validators.required, Validators.minLength(this.nameMinLen), Validators.maxLength(this.nameMaxLen), Validators.pattern(this.nameRegexPattern)]],
      message: ['', [Validators.required, Validators.minLength(this.msgMinLen), Validators.maxLength(this.msgMaxLen)]],
    });
  }

  /**
   * Open dialog
   * @param email email address
   */
  protected openDialog(email: string): void {
    this.dialog.open(ContactPopupComponent, {
      data: {
        emailAddr: email,
      },
    });
  }

  /**
   * Send Email
   */
  protected sendEmail(): void {
    console.log('implement this function');
  }
}
