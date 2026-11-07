import {
  ChangeDetectionStrategy,
  Component,
  computed,
  OnInit,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormGroup,
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Store } from '@ngrx/store';

import {
  ContactMailService,
  type ContactSendStatus,
} from '@portfolio-v2/shared/services';
import {
  IEmailValidatorMsgs,
  IMessageValidatorMsgs,
  ISenderNameValidatorMsgs,
  SOCIAL_LINK_IDS,
} from '@portfolio-v2/state/dataModels';
import { StateActions } from '@portfolio-v2/state';
import { socialMediaSelector } from '@portfolio-v2/state/selectors';
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
  protected readonly socialInfor = this.store.selectSignal(socialMediaSelector);

  /** Email address shown in the introduction and the envelope dialog. */
  protected readonly contactEmail = computed(() => this.socialInfor()
    ?.find((social) => social.id === SOCIAL_LINK_IDS.email)?.media ?? '');

  /** Id of the envelope link, which opens the address dialog. */
  protected readonly emailLinkId = SOCIAL_LINK_IDS.email;

  /** True while the send is in flight. */
  protected readonly isSending = signal(false);

  /** Status shown after a send attempt. */
  protected readonly feedback = signal<{ kind: 'success' | 'error'; text: string } | null>(null);

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
    emailReqError: 'Please enter your email address.',
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
   * @param dialog dialog
   * @param formBuilder form builder
   * @param mail contact mail
   * @param store ngrx store
   */
  constructor(
    private dialog: MatDialog,
    private formBuilder: FormBuilder,
    private mail: ContactMailService,
    private store: Store,
  ) {
    this.store.dispatch(StateActions.socialMediaInformationStateConnect());
  }

  /**
   * Build the contact form, including the honeypot field.
   * @inheritdoc
   */
  public ngOnInit(): void {
    this.contactForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      name: ['', [Validators.required, Validators.minLength(this.nameMinLen), Validators.maxLength(this.nameMaxLen), Validators.pattern(this.nameRegexPattern)]],
      message: ['', [Validators.required, Validators.minLength(this.msgMinLen), Validators.maxLength(this.msgMaxLen)]],
      faxNumber: [''],
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
   * Send the form to the site owner.
   */
  protected async sendEmail(): Promise<void> {
    if (this.contactForm.invalid || this.isSending()) {
      this.contactForm.markAllAsTouched();
      return;
    }
    this.isSending.set(true);
    this.feedback.set(null);
    const status = await this.mail.sendMessage({
      email: String(this.contactForm.get('email')?.value ?? ''),
      name: String(this.contactForm.get('name')?.value ?? ''),
      message: String(this.contactForm.get('message')?.value ?? ''),
      faxNumber: String(this.contactForm.get('faxNumber')?.value ?? ''),
    });
    this.isSending.set(false);
    if (status === 'sent') {
      this.contactForm.reset();
      this.feedback.set({
        kind: 'success',
        text: 'Your message is on its way. I will reply soon.',
      });
      return;
    }
    if (status === 'dry-run') {
      this.contactForm.reset();
      this.feedback.set({
        kind: 'success',
        text: 'This local session accepted the message without sending an email.',
      });
      return;
    }
    this.feedback.set({
      kind: 'error',
      text: this.failureText(status),
    });
  }

  /**
   * Copy for a refused or failed send.
   * @param status Outcome other than a delivery.
   * @returns Text for the status line.
   */
  private failureText(status: Exclude<ContactSendStatus, 'sent' | 'dry-run'>): string {
    if (status === 'limited') {
      return 'Too many messages were sent just now. Please wait a while and try again.';
    }
    if (status === 'invalid') {
      return 'Please check the form and try again.';
    }
    return 'The message could not be sent. Email me directly and I will get back to you.';
  }
}
