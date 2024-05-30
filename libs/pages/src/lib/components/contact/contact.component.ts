import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { GetDataService } from '@portfolio-v2/services';
import { ISocialInfor, IEmailValidatorMsgs, ISenderNameValidatorMsgs, IMessageValidatorMsgs } from '@portfolio-v2/interfaces';
import { ContactPopupComponent } from './components/contact_popup/contact_popup.component';
import { MatDialog } from '@angular/material/dialog';

/**
 * Contact page
 */
@Component({
  selector: 'portfolio-v2-contact',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ContactPopupComponent],
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContactComponent implements OnInit {
  /** Data service */
  private dataService = inject(GetDataService);

  /** Form builder */
  private formBuilder = inject(FormBuilder);

  /** Dialog */
  private dialog = inject(MatDialog);

  /** Contact form */
  public contactForm!: FormGroup;

  /** Social infor */
  public readonly socialInfor: ISocialInfor = this.dataService.getSocialInfor();

  /** Name minimum length */
  public readonly nameMinLen: number = 2;

  /** Name maximum length */
  public readonly nameMaxLen: number = 12;

  /** Name regex pattern */
  public readonly nameRegexPattern: string = '^[a-zA-Z]+$';

  /** Message minimum length */
  public readonly msgMinLen: number = 10;

  /** Message maximum length */
  public readonly msgMaxLen: number = 1000;

  /** Email validator messages */
  public readonly emailValidatorMsgs: IEmailValidatorMsgs = {
    emailReqError: 'Please enter an email address.',
    emailPttrnError: 'Please enter a valid email address.'
  }

  /** Sender text field validator messages */
  public readonly senderValidatorMsgs: ISenderNameValidatorMsgs = {
    senderReqError: 'Please enter your name.',
    senderMinLenError: `A name should have at least ${this.nameMinLen} letters.`,
    senderMaxLenError: `A name should not exceed ${this.nameMaxLen} letters.`,
    senderPttrnError: 'The name can only contain letters.'
  }

  /** Message text field validator messages */
  public readonly msgValidatorMsgs: IMessageValidatorMsgs = {
    msgReqError: 'Please enter a message.',
    msgMinLenError: `The message should have at least ${this.msgMinLen} letters.`,
    msgMaxLenError: `The message should not exceed ${this.msgMaxLen} characters.`
  }

  /**
   * @inheritdoc
   */
  public ngOnInit(): void {
      this.contactForm = this.formBuilder.group({
        email: ['', [Validators.required, Validators.email]],
        name: ['', [Validators.required, Validators.minLength(this.nameMinLen), Validators.maxLength(this.nameMaxLen), Validators.pattern(this.nameRegexPattern)]],
        message: ['', [Validators.required, Validators.minLength(this.msgMinLen), Validators.maxLength(this.msgMaxLen)]]
      });
  }

  /**
   * Open dialog
   * @param email email address
   */
  public openDialog(email: string) {
    this.dialog.open(ContactPopupComponent, {
      data: {
        emailAddr: email
      }
    });
  }

  /**
   * Send Email
   */
  public sendEmail(): void {
    // Todo: Add logic to send email
  }
}
