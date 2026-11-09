import { IEducation } from './IEducation';

/** Firestore collection that holds one document per institute. */
export const EDUCATION_COLLECTION = 'education-section';

/** Raw form values. Validators stay on the form; this is the model boundary. */
export interface EducationFormValues {
  /** Name of the institute. */
  readonly title: string,
  /** Time period, such as `2016 - 2019`. */
  readonly period: string,
  /** Degree name. */
  readonly degree: string,
  /** Grade point average. */
  readonly gpa: string,
  /** Terms or grants the owner was awarded. */
  readonly awards: string,
  /** Credits earned. */
  readonly credits: string,
  /** Graduation date or the next step taken. */
  readonly graduated: string,
  /** Optional extra honors. */
  readonly extra: string,
}

/** Why form values are not an education record. */
export type EducationDraftFailure =
  | 'invalid-id'
  | 'missing-field';

/** Result of turning form values into an education record. */
export type EducationDraftResult =
  | { readonly ok: true; readonly education: IEducation }
  | { readonly ok: false; readonly reason: EducationDraftFailure };

/** Which record a dialog was opened with. */
export type EducationEditTarget =
  | { readonly mode: 'new'; readonly id: number }
  | { readonly mode: 'edit'; readonly education: IEducation };

/**
 * Firestore document path for an institute.
 * @param id institute id
 * @returns path such as `education-section/institute-02`
 */
export function educationDocPath(id: number): string {
  return `${EDUCATION_COLLECTION}/institute-${String(id).padStart(2, '0')}`;
}

/**
 * Next id, one past the largest stored id.
 * @param education stored records, or undefined when the collection has not loaded
 * @returns the largest id plus one, or 1 when there are none
 */
export function nextEducationId(
  education: readonly { readonly id: number }[] | undefined,
): number {
  const ids = (education ?? [])
    .map((record) => record.id)
    .filter((id) => Number.isInteger(id) && id >= 1);

  return ids.length === 0 ? 1 : Math.max(...ids) + 1;
}

/**
 * Build an education record from raw form values.
 * A blank `extra` is stored as an empty string, as the existing records do.
 * @param id id fixed when the editor opened
 * @param values form payload
 * @returns the record, or the first rule that failed
 */
export function toEducationDraft(
  id: number,
  values: EducationFormValues,
): EducationDraftResult {
  if (!Number.isInteger(id) || id < 1) {
    return { ok: false, reason: 'invalid-id' };
  }

  const title = values.title.trim();
  const period = values.period.trim();
  const degree = values.degree.trim();
  const gpa = values.gpa.trim();
  const awards = values.awards.trim();
  const credits = values.credits.trim();
  const graduated = values.graduated.trim();

  if ([title, period, degree, gpa, awards, credits, graduated].some((text) => text.length === 0)) {
    return { ok: false, reason: 'missing-field' };
  }

  return {
    ok: true,
    education: {
      id,
      title,
      period,
      degree,
      gpa,
      awards,
      credits,
      graduated,
      extra: values.extra.trim(),
    },
  };
}
