import {
  AbstractControl,
  ValidationErrors,
  ValidatorFn,
} from '@angular/forms';

/**
 * URL validator
 * @returns validator function
 */
export function urlValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    // Return null if empty or null
    if (!control.value) return null;

    // Safer URL regex that follows RFC 3986 and avoids ReDoS
    const urlPattern = /^https?:\/\/([\w-]+\.)+[\w-]+(\/[\w\-._~:/?#[\]@!$&'()*+,;=]*)?$/;

    try {
      return urlPattern.test(control.value.toString()) ? null : { invalidURL: true };
    } catch (error) {
      // Fallback to basic validation if regex fails
      return { invalidURL: true };
    }
  };
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
    } catch (error) {
      // Fallback to basic validation if regex fails
      return { invalidURL: true };
    }
  };
}
