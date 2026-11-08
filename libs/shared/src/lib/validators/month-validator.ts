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

/**
 * Whether the value is a month from 1 through 12.
 * @param value text or number to check
 * @returns true when the value is a month in that range
 */
export function isMonthNumber(value: unknown): boolean {
  const month = parseInt(String(value), 10);
  return month >= 1 && month <= 12;
}

/**
 * Month validator
 * @returns validator function
 */
export function monthValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) return null;
    return isMonthNumber(control.value) ? null : { invalidMonth: true };
  };
}

/**
 * Signal-forms rule for a month from 1 through 12.
 * An empty value is left to `required`.
 * @param path field that holds the month
 */
export function monthNumber<TPathKind extends PathKind = PathKind.Root>(
  path: SchemaPath<string, SchemaPathRules.Supported, TPathKind>,
): void {
  validate(path, ({ value }) => {
    const current = value();
    if (current === '') {
      return undefined;
    }
    return isMonthNumber(current) ? undefined : { kind: 'invalidMonth' };
  });
}
