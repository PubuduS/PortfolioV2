import 'jest-preset-angular/setup-jest';
import {
  TextEncoder,
  TextDecoder,
} from 'util';

(global as any).TextEncoder = TextEncoder;

(global as any).TextDecoder = TextDecoder;

// @ts-expect-error https://thymikee.github.io/jest-preset-angular/docs/getting-started/test-environment
globalThis.ngJest = {
  testEnvironmentOptions: {
    errorOnUnknownElements: true,
    errorOnUnknownProperties: true,
  },
};
