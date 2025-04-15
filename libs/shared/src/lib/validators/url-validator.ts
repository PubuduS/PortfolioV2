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

    // eslint-disable-next-line no-useless-escape
    const regexForURL = /^(?:http(s)?:\/\/)?[\w.-]+(?:\.[\w\.-]+)+[\w\-\._~:/?#[\]@!\$&'\(\)\*\+,;=.]+$/;
    return regexForURL.test(control.value.toString()) ? null : { invalidURL: true };
  };
}
