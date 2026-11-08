import {
  type PathKind,
  type SchemaPath,
  type SchemaPathRules,
  validate,
} from '@angular/forms/signals';

import {
  isFirebaseUrl,
  isWebUrl,
} from './url-pattern';

export { isFirebaseUrl, isWebUrl };

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
