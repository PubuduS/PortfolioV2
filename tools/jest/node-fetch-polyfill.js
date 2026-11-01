const { TextDecoder, TextEncoder } = require('util');
const { ReadableStream } = require('node:stream/web');
const { MessageChannel, MessagePort } = require('worker_threads');

// undici reads these while it loads, and this file runs before the suite setup.
globalThis.TextEncoder = TextEncoder;
globalThis.TextDecoder = TextDecoder;
globalThis.ReadableStream = ReadableStream;
globalThis.MessageChannel = MessageChannel;
globalThis.MessagePort = MessagePort;

const {
  fetch,
  Headers,
  Request,
  Response,
} = require('undici');

// Firebase Auth's Node build reads global fetch while a spec is imported.
// jsdom does not provide fetch, so the import throws before any test runs.
globalThis.fetch = fetch;
globalThis.Headers = Headers;
globalThis.Request = Request;
globalThis.Response = Response;
