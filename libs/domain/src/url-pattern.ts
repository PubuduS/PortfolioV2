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
