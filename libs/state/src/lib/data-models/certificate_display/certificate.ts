import { ICertificateCard } from './ICertificateCard';

/** Firestore collection that holds one document per certificate. */
export const CERTIFICATE_COLLECTION = 'certification-section';

/** Value stored in `credentialID` when the certificate has none. */
export const NO_CREDENTIAL_ID = 'None';

/** Whether the certificate has been earned yet. */
export type CertificateStatus = ICertificateCard['certification'];

/** Raw form values. Validators stay on the form; this is the model boundary. */
export interface CertificateFormValues {
  /** Certificate title. */
  readonly title: string,
  /** Issuing organization. */
  readonly organization: string,
  /** Completion date text, or an in-progress label. */
  readonly completedDate: string,
  /** Credential id. Blank becomes `None`. */
  readonly credentialID: string,
  /** `Here` once earned, `In Progress` otherwise. */
  readonly certification: CertificateStatus,
  /** Public link to the certificate. Required once it is earned. */
  readonly certificateURL: string,
  /** Short description. */
  readonly description: string,
}

/** Why form values are not a certificate. */
export type CertificateDraftFailure =
  | 'invalid-id'
  | 'missing-field'
  | 'missing-url'
  | 'invalid-url';

/** Result of turning form values into a certificate. */
export type CertificateDraftResult =
  | { readonly ok: true; readonly certificate: ICertificateCard }
  | { readonly ok: false; readonly reason: CertificateDraftFailure };

/** Which record a dialog was opened with. */
export type CertificateEditTarget =
  | { readonly mode: 'new'; readonly id: number }
  | { readonly mode: 'edit'; readonly certificate: ICertificateCard };

/**
 * @param value text to check
 * @returns true when the text parses as an http or https url
 */
function isWebUrl(value: string): boolean {
  try {
    const { protocol } = new URL(value);
    return protocol === 'https:' || protocol === 'http:';
  } catch {
    return false;
  }
}

/**
 * Firestore document path for a certificate.
 * @param id certificate id
 * @returns path such as `certification-section/certification-07`
 */
export function certificateDocPath(id: number): string {
  return `${CERTIFICATE_COLLECTION}/certification-${String(id).padStart(2, '0')}`;
}

/**
 * Next id, one past the largest stored id.
 * @param certificates stored certificates, or undefined when the collection has not loaded
 * @returns the largest id plus one, or 1 when there are none
 */
export function nextCertificateId(
  certificates: readonly { readonly id: number }[] | undefined,
): number {
  const ids = (certificates ?? [])
    .map((certificate) => certificate.id)
    .filter((id) => Number.isInteger(id) && id >= 1);

  return ids.length === 0 ? 1 : Math.max(...ids) + 1;
}

/**
 * Build a certificate record from raw form values.
 * An unearned certificate keeps its link only when one was typed.
 * @param id id fixed when the editor opened
 * @param values form payload
 * @returns the record, or the first rule that failed
 */
export function toCertificateDraft(
  id: number,
  values: CertificateFormValues,
): CertificateDraftResult {
  if (!Number.isInteger(id) || id < 1) {
    return { ok: false, reason: 'invalid-id' };
  }

  const title = values.title.trim();
  const organization = values.organization.trim();
  const completedDate = values.completedDate.trim();
  const description = values.description.trim();

  if ([title, organization, completedDate, description].some((text) => text.length === 0)) {
    return { ok: false, reason: 'missing-field' };
  }

  const certificateURL = values.certificateURL.trim();

  if (values.certification === 'Here' && certificateURL.length === 0) {
    return { ok: false, reason: 'missing-url' };
  }

  if (certificateURL.length > 0 && !isWebUrl(certificateURL)) {
    return { ok: false, reason: 'invalid-url' };
  }

  return {
    ok: true,
    certificate: {
      id,
      title,
      completedDate,
      organization,
      credentialID: values.credentialID.trim() || NO_CREDENTIAL_ID,
      certification: values.certification,
      certificateURL,
      description,
    },
  };
}
