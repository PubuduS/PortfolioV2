import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import {
  email,
  type FieldTree,
  form,
  FormField,
  required,
  submit as submitForm,
} from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Store } from '@ngrx/store';

import { SetDataService } from '@portfolio-v2/shared/services';
import { webUrl } from '@portfolio-v2/shared/validators';
import { StateActions } from '@portfolio-v2/state';
import {
  ISocialInfor,
  SOCIAL_LINK_ICONS,
  SOCIAL_LINK_IDS,
  socialDocPath,
} from '@portfolio-v2/state/dataModels';
import { socialMediaSelector } from '@portfolio-v2/state/selectors';

/** LinkedIn, GitHub, and email addresses. */
interface ContactLinkValues {
  /** LinkedIn URL. */
  linkedin: string;
  /** GitHub URL. */
  github: string;
  /** Email address. */
  email: string;
}

/**
 * Blank contact links. A new object each time so a later edit cannot change the reset value.
 * @returns empty contact links
 */
function emptyLinks(): ContactLinkValues {
  return {
    linkedin: '',
    github: '',
    email: '',
  };
}

/**
 * Admin editor for the LinkedIn, GitHub, and email links on the contact page.
 */
@Component({
  selector: 'admin-contact',
  standalone: true,
  imports: [
    FormField,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './admin-contact.component.html',
  styleUrl: './admin-contact.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminContactComponent implements OnInit {
  /** Values the editor is changing. */
  private readonly model = signal<ContactLinkValues>(emptyLinks());

  /** LinkedIn, GitHub, and email fields. */
  protected readonly contactForm = form(this.model, (fields) => {
    required(fields.linkedin);
    webUrl(fields.linkedin);
    required(fields.github);
    webUrl(fields.github);
    required(fields.email);
    email(fields.email);
  });

  /** True after a save has been written. */
  protected readonly isSaveSuccess = signal(false);

  /** True while the three records are being written. */
  protected readonly isSaving = signal(false);

  /** Shown when the write fails. */
  protected readonly saveError = signal<string | null>(null);

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
   * Whether a touched or dirty field currently has this error.
   * @param field field to read
   * @param kind error kind
   * @returns true when that error should be shown
   */
  protected hasError(field: FieldTree<unknown>, kind: string): boolean {
    const state = field();
    return (state.touched() || state.dirty()) && state.getError(kind) !== undefined;
  }

  /**
   * Write the three contact links.
   */
  protected async save(): Promise<void> {
    if (this.isSaving()) {
      return;
    }
    await submitForm(this.contactForm, async () => {
      await this.persistLinks();
    });
  }

  /**
   * Copy stored links into the form once, leaving later edits in place.
   * @param social Stored links, once the listener has delivered them.
   */
  private applySocial(social: ISocialInfor[] | undefined): void {
    if (this.hasAppliedSocial || !social?.length) {
      return;
    }
    this.contactForm().reset({
      linkedin: this.mediaFor(social, SOCIAL_LINK_IDS.linkedin),
      github: this.mediaFor(social, SOCIAL_LINK_IDS.github),
      email: this.mediaFor(social, SOCIAL_LINK_IDS.email),
    });
    this.hasAppliedSocial = true;
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
    const { linkedin, github, email: address } = this.contactForm().value();
    return [
      this.record(SOCIAL_LINK_IDS.linkedin, linkedin, SOCIAL_LINK_ICONS.linkedin),
      this.record(SOCIAL_LINK_IDS.github, github, SOCIAL_LINK_ICONS.github),
      this.record(SOCIAL_LINK_IDS.email, address, SOCIAL_LINK_ICONS.email),
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
