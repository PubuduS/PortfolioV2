import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  effect,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Store } from '@ngrx/store';

import { DisplayValidatorErrorsComponent } from '@portfolio-v2/admin/shared/components';
import { SetDataService } from '@portfolio-v2/shared/services';
import { urlValidator } from '@portfolio-v2/shared/validators';
import { StateActions } from '@portfolio-v2/state';
import {
  ISocialInfor,
  SOCIAL_LINK_ICONS,
  SOCIAL_LINK_IDS,
  socialDocPath,
} from '@portfolio-v2/state/dataModels';
import { socialMediaSelector } from '@portfolio-v2/state/selectors';

/** Editable contact links. */
interface ContactLinkForm {
  /** LinkedIn URL. */
  linkedin: FormControl<string>;
  /** GitHub URL. */
  github: FormControl<string>;
  /** Email address. */
  email: FormControl<string>;
}

/**
 * Admin editor for the LinkedIn, GitHub, and email links on the contact page.
 */
@Component({
  selector: 'admin-contact',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    DisplayValidatorErrorsComponent,
  ],
  templateUrl: './admin-contact.component.html',
  styleUrl: './admin-contact.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminContactComponent implements OnInit {
  /** LinkedIn, GitHub, and email fields. */
  protected readonly contactForm = new FormGroup<ContactLinkForm>({
    linkedin: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, urlValidator()],
    }),
    github: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, urlValidator()],
    }),
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
  });

  /** True after a save has been written. */
  protected readonly isSaveSuccess = signal(false);

  /** True while the three records are being written. */
  protected readonly isSaving = signal(false);

  /** Shown when the write fails. */
  protected readonly saveError = signal<string | null>(null);

  /** Refreshes the form after a late store update. */
  private readonly changeDetector = inject(ChangeDetectorRef);

  /** Firestore writes. */
  private readonly setData = inject(SetDataService);

  /** Application store. */
  private readonly store = inject(Store);

  /** Stored contact links. */
  private readonly socialInfor = this.store.selectSignal(socialMediaSelector);

  /** True after the form has been filled from stored records. */
  private hasAppliedSocial = false;

  /**
   * Open the contact-link listener and fill the form when those links arrive.
   */
  constructor() {
    this.store.dispatch(StateActions.socialMediaInformationStateConnect());
    effect(() => {
      this.applySocial(this.socialInfor());
    });
  }

  /**
   * Fill the form when the links are already in the store.
   * @inheritdoc
   */
  public ngOnInit(): void {
    this.applySocial(this.socialInfor());
  }

  /**
   * Write the three contact links.
   */
  protected save(): void {
    if (this.contactForm.invalid || this.isSaving()) {
      this.contactForm.markAllAsTouched();
      return;
    }
    this.persistLinks().catch(() => undefined);
  }

  /**
   * Copy stored links into the form once, leaving later edits in place.
   * @param social Stored links, once the listener has delivered them.
   */
  private applySocial(social: ISocialInfor[] | undefined): void {
    if (this.hasAppliedSocial || !social?.length) {
      return;
    }
    this.contactForm.patchValue({
      linkedin: this.mediaFor(social, SOCIAL_LINK_IDS.linkedin),
      github: this.mediaFor(social, SOCIAL_LINK_IDS.github),
      email: this.mediaFor(social, SOCIAL_LINK_IDS.email),
    });
    this.hasAppliedSocial = true;
    this.changeDetector.markForCheck();
  }

  /**
   * Stored address for one link id.
   * @param social Stored links.
   * @param id Link id.
   * @returns The stored address, or an empty string when that link is missing.
   */
  private mediaFor(social: readonly ISocialInfor[], id: number): string {
    return social.find((item) => item.id === id)?.media ?? '';
  }

  /**
   * Write the form and refresh the store.
   */
  private async persistLinks(): Promise<void> {
    const records = this.recordsFromForm();
    this.isSaving.set(true);
    this.isSaveSuccess.set(false);
    this.saveError.set(null);
    try {
      await this.setData.commit(records.map((record) => ({
        kind: 'set' as const,
        path: socialDocPath(record.id),
        value: record,
      })));
      this.store.dispatch(StateActions.socialMediaInformationStateUpdated({
        socialInfor: records,
      }));
      this.isSaveSuccess.set(true);
    } catch {
      this.saveError.set('The contact links could not be saved. Try again.');
    } finally {
      this.isSaving.set(false);
    }
  }

  /**
   * Build the three records from the form, keeping each stored icon.
   * @returns LinkedIn, GitHub, and email records.
   */
  private recordsFromForm(): ISocialInfor[] {
    const { linkedin, github, email } = this.contactForm.getRawValue();
    return [
      this.record(SOCIAL_LINK_IDS.linkedin, linkedin, SOCIAL_LINK_ICONS.linkedin),
      this.record(SOCIAL_LINK_IDS.github, github, SOCIAL_LINK_ICONS.github),
      this.record(SOCIAL_LINK_IDS.email, email, SOCIAL_LINK_ICONS.email),
    ];
  }

  /**
   * One contact record, with the stored icon when one already exists.
   * @param id Link id.
   * @param media Address entered in the form.
   * @param fallbackIcon Icon used when the stored record has none.
   * @returns Record ready to store.
   */
  private record(id: number, media: string, fallbackIcon: string): ISocialInfor {
    const storedIcon = this.socialInfor()?.find((item) => item.id === id)?.mediaIcon;
    return {
      id,
      media: media.trim(),
      mediaIcon: storedIcon || fallbackIcon,
    };
  }
}
