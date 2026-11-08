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

/**
 * Firebase URL validator
 * @returns validator function
 */
export function firebaseURLValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    // Return null if empty or null
    if (!control.value) return null;

    // URL regex that allows Firebase Storage URLs with query parameters
    const urlPattern = /^https?:\/\/.+$/;
    try {
      return urlPattern.test(control.value.toString()) ? null : { invalidURL: true };
    } catch (_error) {
      // Fallback to basic validation if regex fails
      return { invalidURL: true };
    }
  };
}
