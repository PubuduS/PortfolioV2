/**
 * Test utilities for admin library
 *
 * Usage in test files:
 * ```typescript
 * import { getComponentProperty, callComponentMethod } from '@portfolio-v2/shared/test-helpers';
 *
 * // Access protected/private properties
 * const value = getComponentProperty(component, 'myProperty');
 *
 * // Call protected/private methods
 * const result = callComponentMethod(component, 'myMethod', arg1, arg2);
 *
 * // Setup spies manually (use jest.spyOn directly in test files)
 * jest.spyOn(component['dialog'], 'open');
 * jest.spyOn(component['router'], 'navigate');
 * ```
 */

/**
 * Helper function to access protected/private properties in tests
 * @param component - The component instance
 * @param property - The property name to access
 * @returns The property value
 */
export function getComponentProperty<T>(component: any, property: string): T {
  return component[property];
}

/**
 * Helper function to call protected/private methods in tests
 * @param component - The component instance
 * @param method - The method name to call
 * @param args - Arguments to pass to the method
 * @returns The method result
 */
export function callComponentMethod<T>(
  component: any,
  method: string,
  ...args: any[]
): T {
  return component[method](...args);
}
