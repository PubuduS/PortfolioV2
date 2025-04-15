import * as _ from 'lodash';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  Signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Store } from '@ngrx/store';
import {
  MatDialog,
  MatDialogModule,
} from '@angular/material/dialog';
import {
  map,
  of,
  take,
} from 'rxjs';

import { SetDataService } from '@portfolio-v2/shared/services';
import { aboutMeSelector } from '@portfolio-v2/state/selectors';
import { IAboutMe } from '@portfolio-v2/state/dataModels';
import { DisplayValidatorErrorsComponent } from '@portfolio-v2/shared/components';
import { urlValidator } from '@portfolio-v2/shared/validators';
import { StateActions } from '@portfolio-v2/state';
import { UploadPhotoComponent } from './components/upload-photo.component';

/**
 * About me admin section
 */
@Component({
  selector: 'admin-about-me',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatIconModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatProgressBarModule,
    MatDialogModule,
    DisplayValidatorErrorsComponent,
  ],
  templateUrl: './about-me.component.html',
  styleUrl: './about-me.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AboutMeComponent implements OnInit {
  /** Landing form */
  protected aboutMeForm!: FormGroup;

  protected isSaveSuccess = of(false);

  /** Signal containing About Me section data */
  public readonly aboutMeData: Signal<IAboutMe | undefined>;

  /**
   * constructor
   * @param formBuilder form builder
   * @param setDataService Set Data Service
   * @param store ngrx store
   * @param dialog Mat Dialog
   */
  constructor(
    private formBuilder: FormBuilder,
    private setDataService: SetDataService,
    private store: Store,
    private dialog: MatDialog,
  ) {
    this.aboutMeData = this.store.selectSignal(aboutMeSelector);
  }

  /**
   * @inheritdoc
   */
  public ngOnInit(): void {
    const aboutObject = this.aboutMeData();
    const allParagraphs = this.seperateSentences(aboutObject?.intro);

    this.aboutMeForm = this.formBuilder.group({
      mainIntro: [`${allParagraphs}`, [Validators.required]],
      subIntro: [`${aboutObject?.subHeadingIntro}`, [Validators.required]],
      leftPoints: [`${this.seperateSentences(aboutObject?.leftPoints)}`, [Validators.required]],
      rightPoints: [`${this.seperateSentences(aboutObject?.rightPoints)}`, [Validators.required]],
      linkField: [`${aboutObject?.link}`, [Validators.required, urlValidator()]],
    });
  }

  /**
   * Open the photo upload dialog
   */
  protected openDialog(): void {
    this.dialog.open(UploadPhotoComponent, { autoFocus: 'first-tabbable', restoreFocus: true });
  }

  protected updateData(): void {
    const {
      mainIntro, subIntro, leftPoints, rightPoints, linkField,
    } = this.aboutMeForm.value;
    const newAboutMeValues: IAboutMe = {
      id: 1,
      imageSrc: this.aboutMeData()?.imageSrc ?? '',
      intro: this.breakStringToParagraphs(mainIntro),
      subHeadingIntro: subIntro,
      leftPoints: this.breakStringToParagraphs(leftPoints),
      rightPoints: this.breakStringToParagraphs(rightPoints),
      link: linkField,
    };
    this.isSaveSuccess = this.setDataService.setRecord('about-me-section/part-01/', newAboutMeValues).pipe(
      take(1),
      map((result) => {
        this.store.dispatch(StateActions.aboutMeStateUpdated({
          aboutMe: newAboutMeValues,
        }));
        return result === 'successfull';
      }),
    );
  }

  /**
   * Break long string into paragraphs based on new line.
   * @param value long sentence
   * @returns array of strings
   */
  private breakStringToParagraphs(value: string): string[] {
    const introArray: string[] = _.pull(value.split('\n'), '');
    return introArray;
  }

  /**
   * Separate paragraphs by adding new lines
   * @param longSentence long sentence
   * @returns string with multiple paragraphs separated by new line.
   */
  private seperateSentences(longSentence: string[] | undefined): string {
    if (!longSentence) {
      return '';
    }

    let paragraphs = '';
    longSentence?.forEach((param) => {
      paragraphs += `${param}\n\n`;
    });
    return _.trim(paragraphs);
  }
}
