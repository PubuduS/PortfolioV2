import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { GetdataService } from '@portfolio-v2/services';
import { ISocialInfor, IEmailValidatorMsgs, ISenderNameValidatorMsgs, IMessageValidatorMsgs } from '@portfolio-v2/interfaces';
import { ContactPopupComponent } from '@portfolio-v2/contact_popup';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'portfolio-v2-contact',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ContactPopupComponent],
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.css',
})
export class ContactComponent implements OnInit {
  private dataService = inject(GetdataService);
  private formBuilder = inject(FormBuilder);
  private dialog = inject(MatDialog);

  public contactForm!: FormGroup;

  public readonly socialInfor: ISocialInfor = this.dataService.getSocialInfor();
  
  public readonly nameMinLen: number = 2;
  public readonly nameMaxLen: number = 12;
  public readonly nameRegexPattern: string = '^[a-zA-Z]+$';

  public readonly msgMinLen: number = 10;
  public readonly msgMaxLen: number = 1000;

  public readonly emailValidatorMsgs: IEmailValidatorMsgs = {
    emailReqError: 'Please enter an email address.',
    emailPttrnError: 'Please enter a valid email address.'
  }

  public readonly senderValidatorMsgs: ISenderNameValidatorMsgs = {
    senderReqError: 'Please enter your name.',
    senderMinLenError: `A name should have at least ${this.nameMinLen} letters.`,
    senderMaxLenError: `A name should not exceed ${this.nameMaxLen} letters.`,
    senderPttrnError: 'The name can only contain letters.'
  }

  public readonly msgValidatorMsgs: IMessageValidatorMsgs = {
    msgReqError: 'Please enter a message.',
    msgMinLenError: `The message should have at least ${this.msgMinLen} letters.`,
    msgMaxLenError: `The message should not exceed ${this.msgMaxLen} characters.`
  }

  public ngOnInit(): void {
      this.contactForm = this.formBuilder.group({
        email: ['', [Validators.required, Validators.email]],
        name: ['', [Validators.required, Validators.minLength(this.nameMinLen), Validators.maxLength(this.nameMaxLen), Validators.pattern(this.nameRegexPattern)]],
        message: ['', [Validators.required, Validators.minLength(this.msgMinLen), Validators.maxLength(this.msgMaxLen)]]
      });
  }

  public openDialog(email: string) {     
    this.dialog.open(ContactPopupComponent, {
      data: {
        emailAddr: email
      }
    });
  }

  public sendEmail(): void {
    // Todo: Add logic to send email
  }
}
