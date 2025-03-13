import 'jest-preset-angular/setup-jest';

import { ReadableStream } from 'node:stream/web';

(global as any).ReadableStream = ReadableStream;

// @ts-expect-error https://thymikee.github.io/jest-preset-angular/docs/getting-started/test-environment
globalThis.ngJest = {
  testEnvironmentOptions: {
    errorOnUnknownElements: true,
    errorOnUnknownProperties: true,
  },
};
