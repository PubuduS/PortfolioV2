import { setupZoneTestEnv } from 'jest-preset-angular/setup-env/zone';
import {
  TextEncoder,
  TextDecoder,
} from 'util';
import { ReadableStream } from 'node:stream/web';

(global as any).ReadableStream = ReadableStream;

(global as any).TextEncoder = TextEncoder;

(global as any).TextDecoder = TextDecoder;

setupZoneTestEnv();
// @ts-expect-error https://thymikee.github.io/jest-preset-angular/docs/getting-started/test-environment
globalThis.ngJest = {
  testEnvironmentOptions: {
    errorOnUnknownElements: true,
    errorOnUnknownProperties: true,
  },
};
