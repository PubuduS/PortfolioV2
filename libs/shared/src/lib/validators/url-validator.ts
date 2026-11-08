import {
  AbstractControl,
  ValidationErrors,
  ValidatorFn,
} from '@angular/forms';
import {
  type PathKind,
  type SchemaPath,
  type SchemaPathRules,
  validate,
} from '@angular/forms/signals';

/** http or https URL with a dotted host. */
const WEB_URL_PATTERN = /^https?:\/\/([\w-]+\.)+[\w-]+(\/[\w\-._~:/?#[\]@!$&'()*+,;=]*)?$/;

/**
 * Whether the value is an http or https URL with a dotted host.
 * @param value text to check
 * @returns true when the text matches the web URL pattern
 */
export function isWebUrl(value: unknown): boolean {
  try {
    return WEB_URL_PATTERN.test(String(value));
  } catch (_error) {
    return false;
  }
}

/**
 * URL validator
 * @returns validator function
 */
export function urlValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) return null;
    return isWebUrl(control.value) ? null : { invalidURL: true };
  };
}

/**
 * Signal-forms rule for an http or https URL with a dotted host.
 * An empty value is left to `required`.
 * @param path field that holds the URL
 */
export function webUrl<TPathKind extends PathKind = PathKind.Root>(
  path: SchemaPath<string, SchemaPathRules.Supported, TPathKind>,
): void {
  validate(path, ({ value }) => {
    const current = value();
    if (current === '') {
      return undefined;
    }
    return isWebUrl(current) ? undefined : { kind: 'invalidURL' };
  });
}

/** Any http or https URL, including hosts without a dot and query strings. */
const FIREBASE_URL_PATTERN = /^https?:\/\/.+$/;

/**
 * Whether the value is any http or https URL.
 * @param value text to check
 * @returns true when the text starts with http:// or https://
 */
export function isFirebaseUrl(value: unknown): boolean {
  try {
    return FIREBASE_URL_PATTERN.test(String(value));
  } catch (_error) {
    return false;
  }
}

/**
 * Firebase URL validator
 * @returns validator function
 */
export function firebaseURLValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) return null;
    return isFirebaseUrl(control.value) ? null : { invalidURL: true };
  };
}

/**
 * Signal-forms rule for any http or https URL.
 * An empty value is left to `required`.
 * @param path field that holds the URL
 */
export function firebaseUrl<TPathKind extends PathKind = PathKind.Root>(
  path: SchemaPath<string, SchemaPathRules.Supported, TPathKind>,
): void {
  validate(path, ({ value }) => {
    const current = value();
    if (current === '') {
      return undefined;
    }
    return isFirebaseUrl(current) ? undefined : { kind: 'invalidURL' };
  });
}
