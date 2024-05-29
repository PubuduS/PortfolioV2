import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormGroup, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { GetDataService, GetDateTimeService } from '@portfolio-v2/services';
import { ISocialInfor, IManagerValidatorMsgs, ICompanyValidatorMsgs } from '@portfolio-v2/interfaces';
import  Docxtemplater  from 'docxtemplater';
import  PizZip  from 'pizzip';
import  PizZipUtils  from 'pizzip/utils/index.js';
import  { saveAs } from 'file-saver';

function loadFile(url: string, callback: { (error: Error | null, content: string): void; (err: Error, data: string): void; }) {
  PizZipUtils.getBinaryContent(url, callback);
}

@Component({
  selector: 'portfolio-v2-cover-letter',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './cover_letter.component.html',
  styleUrl: './cover_letter.component.css',
})
export class CoverLetterComponent implements OnInit {

  private dataService = inject(GetDataService);
  private router = inject(Router);
  private formBuilder = inject(FormBuilder);
  private dateTimeService = inject(GetDateTimeService);

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

  public onSubmit(): void {

    const formValues = this.coverLetterForm.value;
    let manager = formValues.managerName;
    const date = this.dateTimeService.getDate();

    if(manager=='' || manager==undefined || manager == null) {
      manager = 'Hiring Committee'
    }

    loadFile(
      'assets/CoverLetter/PubuduCoverLetter.docx',
      function (error: Error | null, content: string) {
        if (error) {
          throw error;
        }
        const zip = new PizZip(content);
        const doc = new Docxtemplater(zip, {
          paragraphLoop: true,
          linebreaks: true,
        });
        doc.setData({
          Date: date,
          Manager: manager,
          Position: formValues.position,
          Company: formValues.company,
        });
        try {
          // render the document (replace all occurences of {first_name} by John, {last_name} by Doe, ...)
          doc.render();
        } catch (error) {
          console.log(JSON.stringify({ error: error }));
        }
        const out = doc.getZip().generate({
          type: 'blob',
          mimeType:
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        });
        // Output the document using Data-URI
        saveAs(out, 'PWijesooriya_Cover_Letter.docx');
      }
    );
  }
}
