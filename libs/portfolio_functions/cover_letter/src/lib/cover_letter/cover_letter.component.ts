import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormGroup, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { GetdataService } from '@portfolio-v2/services';
import { ISocialInfor, IManagerValidatorMsgs, ICompanyValidatorMsgs } from '@portfolio-v2/interfaces';

@Component({
  selector: 'portfolio-v2-cover-letter',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './cover_letter.component.html',
  styleUrl: './cover_letter.component.css',
})
export class CoverLetterComponent implements OnInit {

  private dataService = inject(GetdataService);
  private router = inject(Router);
  private formBuilder = inject(FormBuilder);

  public coverLetterForm!: FormGroup;

  public readonly positions: string[] = [
    'Software Engineer',
    'Junior Software Engineer',
    'Software Developer',
    'Full Stack Software Engineer',
    'Full Stack Software Developer',
    'C++ Developer',
    'Angular Developer',
    'Java Developer',
    'Junior Game Developer',
    'Game Developer'
  ];

  public readonly socialInfor: ISocialInfor = this.dataService.getSocialInfor();

  public readonly nameMaxLen: number = 12;
  public readonly nameRegexPattern: string = '^[a-zA-Z]+$';

  public readonly cmpMaxLen: number = 12;

  public readonly mngValidatorMessages: IManagerValidatorMsgs = {
    mngPatternError: 'The name can only contain letters.',
    mngNameMaxLen: `The name cannot be more than ${this.nameMaxLen} characters.`
  }

  public readonly cmpValidatorMessages: ICompanyValidatorMsgs = {
    cmpNameReqError: 'Please enter the company name.',
    cmpNameMaxLen: `The name cannot be more than ${this.cmpMaxLen} characters.`
  }

  public ngOnInit(): void {

    this.coverLetterForm = this.formBuilder.group({
      managerName: ['', [Validators.pattern(this.nameRegexPattern), Validators.maxLength(this.nameMaxLen)]],
      position: 'Software Engineer',
      company: ['', [Validators.required, Validators.maxLength(this.cmpMaxLen)] ]
    });
  }

  public goToContactPage(): void {
    this.router.navigate(['contact']);
  }

  public generateLetter(): void {
    
  }

}
