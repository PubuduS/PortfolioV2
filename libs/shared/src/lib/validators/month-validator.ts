import {
  AbstractControl,
  ValidationErrors,
  ValidatorFn,
} from '@angular/forms';

/**
 * Month validator
 * @returns validator function
 */
export function monthValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    // Return null if empty or null
    if (!control.value) return null;
    const month = parseInt(control.value, 10);
    return (month >= 1 && month <= 12) ? null : { invalidMonth: true };
  };
}
