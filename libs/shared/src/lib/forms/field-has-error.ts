import { type FieldTree } from '@angular/forms/signals';

/**
 * Whether a touched or dirty field currently has this error.
 * @param field field to read
 * @param kind error kind
 * @returns true when that error should be shown
 */
export function fieldHasError(field: FieldTree<unknown>, kind: string): boolean {
  const state = field();
  return (state.touched() || state.dirty()) && state.getError(kind) !== undefined;
}
