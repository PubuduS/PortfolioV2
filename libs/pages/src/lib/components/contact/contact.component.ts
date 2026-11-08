import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
} from '@angular/core';
import {
  email,
  form,
  FormField,
  maxLength,
  minLength,
  pattern,
  required,
  submit,
} from '@angular/forms/signals';
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

/** Values posted from the public contact form, including the honeypot. */
interface ContactValues {
  /** Email address. */
  email: string;
  /** Name. */
  name: string;
  /** Message. */
  message: string;
  /** Fax number. */
  faxNumber: string;
}

/**
 * Contact page
 */
@Component({
  selector: 'portfolio-v2-contact',
  standalone: true,
  imports: [FormField],
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContactComponent {
  /** Name minimum length */
  protected readonly nameMinLen: number = 2;

  /** Name maximum length */
  protected readonly nameMaxLen: number = 12;

  /** Name regex pattern */
  private readonly namePattern = /^[a-zA-Z]+$/;

  /** Message minimum length */
  protected readonly msgMinLen: number = 10;

  /** Message maximum length */
  protected readonly msgMaxLen: number = 1000;

  /** Message the visitor typed, plus the hidden fax field. */
  private readonly contactModel = signal<ContactValues>({
    email: '',
    name: '',
    message: '',
    faxNumber: '',
  });

  /** Contact form */
  protected readonly contactForm = form(this.contactModel, (fields) => {
    required(fields.email);
    email(fields.email);
    required(fields.name);
    minLength(fields.name, this.nameMinLen);
    maxLength(fields.name, this.nameMaxLen);
    pattern(fields.name, this.namePattern);
    required(fields.message);
    minLength(fields.message, this.msgMinLen);
    maxLength(fields.message, this.msgMaxLen);
  });

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
   * @param mail contact mail
   * @param store ngrx store
   */
  constructor(
    private dialog: MatDialog,
    private mail: ContactMailService,
    private store: Store,
  ) {
    this.store.dispatch(StateActions.socialMediaInformationStateConnect());
  }

  /**
   * Open dialog
   * @param emailAddress email address
   */
  protected openDialog(emailAddress: string): void {
    this.dialog.open(ContactPopupComponent, {
      data: {
        emailAddr: emailAddress,
      },
    });
  }

  /**
   * Send the form to the site owner.
   */
  protected async sendEmail(): Promise<void> {
    if (this.isSending()) {
      return;
    }
    await submit(this.contactForm, async () => {
      this.isSending.set(true);
      this.feedback.set(null);
      const {
        email: address,
        name,
        message,
        faxNumber,
      } = this.contactForm().value();
      const status = await this.mail.sendMessage({
        email: address,
        name,
        message,
        faxNumber,
      });
      this.isSending.set(false);
      if (status === 'sent') {
        this.contactForm().reset(this.emptyContact());
        this.feedback.set({
          kind: 'success',
          text: 'Your message is on its way. I will reply soon.',
        });
        return undefined;
      }
      if (status === 'dry-run') {
        this.contactForm().reset(this.emptyContact());
        this.feedback.set({
          kind: 'success',
          text: 'This local session accepted the message without sending an email.',
        });
        return undefined;
      }
      this.feedback.set({
        kind: 'error',
        text: this.failureText(status),
      });
      return undefined;
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

  /**
   * A blank contact draft. A new object each time so a later edit cannot
   * change the value passed to reset.
   * @returns Empty contact values.
   */
  private emptyContact(): ContactValues {
    return {
      email: '',
      name: '',
      message: '',
      faxNumber: '',
    };
  }
}
