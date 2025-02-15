import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  FormGroup,
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';
import PizZipUtils from 'pizzip/utils/index.js';
import { saveAs } from 'file-saver';

import {
  GetDataService,
  GetDateTimeService,
} from '@portfolio-v2/shared/services';
import {
  ISocialInfor,
  IManagerValidatorMsgs,
  ICompanyValidatorMsgs,
} from '@portfolio-v2/interfaces';

/**
 * Load File
 * @param url url
 * @param callback callback function
 */
function loadFile(url: string, callback: {
  (error: Error | null, content: string): void;
  (err: Error, data: string): void; }): void {
  PizZipUtils.getBinaryContent(url, callback);
}

/**
 * Dynamic cover letter creation
 */
@Component({
  selector: 'portfolio-v2-cover-letter',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './cover_letter.component.html',
  styleUrl: './cover_letter.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CoverLetterComponent implements OnInit {
  /** Data service */
  private dataService = inject(GetDataService);

  /** Router */
  private router = inject(Router);

  /** Form builder */
  private formBuilder = inject(FormBuilder);

  /** Date time service */
  private dateTimeService = inject(GetDateTimeService);

  /** Cover letter form */
  public coverLetterForm!: FormGroup;

  /** positions */
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
    'Game Developer',
  ];

  /** Social infor */
  public readonly socialInfor: ISocialInfor = this.dataService.getSocialInfor();

  /** Name max length */
  public readonly nameMaxLen: number = 12;

  /** Name regex pattern */
  public readonly nameRegexPattern: string = '^[a-zA-Z]+$';

  /** Company name max length */
  public readonly cmpMaxLen: number = 12;

  /** Manager name validator messages */
  public readonly mngValidatorMessages: IManagerValidatorMsgs = {
    mngPatternError: 'The name can only contain letters.',
    mngNameMaxLen: `The name cannot be more than ${this.nameMaxLen} characters.`,
  };

  /** Company name validator messages */
  public readonly cmpValidatorMessages: ICompanyValidatorMsgs = {
    cmpNameReqError: 'Please enter the company name.',
    cmpNameMaxLen: `The name cannot be more than ${this.cmpMaxLen} characters.`,
  };

  /**
   * @inheritdoc
   */
  public ngOnInit(): void {
    this.coverLetterForm = this.formBuilder.group({
      managerName: ['', [Validators.pattern(this.nameRegexPattern), Validators.maxLength(this.nameMaxLen)]],
      position: 'Software Engineer',
      company: ['', [Validators.required, Validators.maxLength(this.cmpMaxLen)]],
    });
  }

  /**
   * Go to contact page
   */
  public goToContactPage(): void {
    this.router.navigate(['contact']);
  }

  /**
   * On submit
   */
  public onSubmit(): void {
    const formValues = this.coverLetterForm.value;
    let manager = formValues.managerName;
    const date = this.dateTimeService.getDate();

    if (manager === '' || manager === undefined || manager == null) {
      manager = 'Hiring Committee';
    }

    loadFile(
      'assets/CoverLetter/PubuduCoverLetter.docx',
      (error: Error | null, content: string) => {
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
          // render the document (replace all occurences of {first_name}
          //  by John, {last_name} by Doe, ...)
          doc.render();
        } catch (err) {
          console.log(JSON.stringify({ err }));
        }
        const out = doc.getZip().generate({
          type: 'blob',
          mimeType:
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        });
        // Output the document using Data-URI
        saveAs(out, 'PWijesooriya_Cover_Letter.docx');
      },
    );
  }
}
