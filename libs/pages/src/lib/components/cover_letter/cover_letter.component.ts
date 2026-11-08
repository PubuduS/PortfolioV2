import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  form,
  FormField,
  maxLength,
  pattern,
  required,
  submit,
} from '@angular/forms/signals';
import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';
import { saveAs } from 'file-saver';
import { Observable } from 'rxjs';

import {
  DocumentCatalogReader,
  GetDataService,
  GetDateTimeService,
} from '@portfolio-v2/shared/services';
import {
  ISocialInfor,
  IManagerValidatorMsgs,
  ICompanyValidatorMsgs,
} from '@portfolio-v2/state/dataModels';

/** Fields written into the cover-letter template. */
interface CoverLetterValues {
  /** Manager name */
  managerName: string;
  /** Position */
  position: string;
  /** Company */
  company: string;
}

/**
 * Dynamic cover letter creation
 */
@Component({
  selector: 'portfolio-v2-cover-letter',
  standalone: true,
  imports: [CommonModule, FormField],
  templateUrl: './cover_letter.component.html',
  styleUrl: './cover_letter.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CoverLetterComponent {
  /** Name max length */
  protected readonly nameMaxLen: number = 12;

  /** Name regex pattern */
  private readonly namePattern = /^[a-zA-Z]+$/;

  /** Company name max length */
  protected readonly cmpMaxLen: number = 12;

  /** Manager, position, and company typed into the generator. */
  private readonly coverLetterModel = signal<CoverLetterValues>({
    managerName: '',
    position: 'Software Engineer',
    company: '',
  });

  /** Cover letter form */
  protected readonly coverLetterForm = form(this.coverLetterModel, (fields) => {
    pattern(fields.managerName, this.namePattern);
    maxLength(fields.managerName, this.nameMaxLen);
    required(fields.company);
    maxLength(fields.company, this.cmpMaxLen);
  });

  /** positions */
  protected readonly positions: string[] = [
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
    'Web Developer',
  ];

  /** Social infor */
  protected readonly socialInfor: Observable<ISocialInfor[]>;

  /** True while the cover-letter catalog has not produced a snapshot. */
  protected readonly isTemplateLoading = computed(
    () => this.documents.view('cover-letter')().status === 'loading',
  );

  /** Shown when the template bytes cannot be read. */
  protected readonly templateMessage = signal<string | null>(null);

  /** Manager name validator messages */
  protected readonly mngValidatorMessages: IManagerValidatorMsgs = {
    mngPatternError: 'The name can only contain letters.',
    mngNameMaxLen: `The name cannot be more than ${this.nameMaxLen} characters.`,
  };

  /** Company name validator messages */
  protected readonly cmpValidatorMessages: ICompanyValidatorMsgs = {
    cmpNameReqError: 'Please enter the company name.',
    cmpNameMaxLen: `The name cannot be more than ${this.cmpMaxLen} characters.`,
  };

  /** Catalog reads for the current cover-letter template. */
  private readonly documents = inject(DocumentCatalogReader);

  /**
   * constructor
   * @param dataService data service
   * @param dateTimeService date time service
   * @param router router
   */
  constructor(
    private dataService: GetDataService,
    private dateTimeService: GetDateTimeService,
    private router: Router,
  ) {
    this.socialInfor = this.dataService.getDataArray<ISocialInfor>('social-infor-section');
  }

  /**
   * Go to contact page
   */
  protected goToContactPage(): void {
    this.router.navigate(['content/contact']);
  }

  /**
   * On submit
   */
  protected async onSubmit(): Promise<void> {
    await submit(this.coverLetterForm, async () => {
      const formValues = this.coverLetterForm().value();
      let manager = formValues.managerName;
      const date = this.dateTimeService.getDate();

      if (manager === '') {
        manager = 'Hiring Committee';
      }

      try {
        const bytes = await this.documents.coverLetterTemplate();
        const zip = new PizZip(bytes);
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
        doc.render();
        const out = doc.getZip().generate({
          type: 'blob',
          mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        });
        saveAs(out, 'PWijesooriya_Cover_Letter.docx');
        this.templateMessage.set(null);
      } catch {
        this.templateMessage.set('The template could not be read.');
      }
      return undefined;
    });
  }
}
