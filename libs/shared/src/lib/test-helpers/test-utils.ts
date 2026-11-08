/**
 * Reach a protected or private member from a unit test without casting the
 * component to `any`. The member keeps the type the caller names.
 *
 * Prefer `component['member']` when that access type-checks. Use these helpers
 * only when the member is hidden from the test file.
 */

/**
 * Read a protected or private field.
 * @param component component under test
 * @param property field name
 * @returns the field value
 */
export function getComponentProperty<R>(
  component: object,
  property: string,
): R {
  const host = component as Record<string, R>;
  return host[property];
}

/**
 * Call a protected or private method.
 * @param component component under test
 * @param method method name
 * @param args arguments
 * @returns the method result
 */
export function callComponentMethod<R>(
  component: object,
  method: string,
  ...args: readonly unknown[]
): R {
  const host = component as Record<string, (...params: readonly unknown[]) => R>;
  return host[method](...args);
}

/**
 * Spy on a protected or private method.
 * @param component component under test
 * @param method method name
 * @returns the Jest spy
 */
export function spyOnMethod(
  component: object,
  method: string,
): jest.SpyInstance {
  const host = component as Record<string, (...params: unknown[]) => unknown>;
  return jest.spyOn(host, method);
}
