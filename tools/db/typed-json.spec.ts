import {
  type BaselineDocument,
  canonicalCollectionHash,
  type DecodeCodec,
  decodeTypedValue,
  encodeTypedValue,
  parseBaselineDocuments,
} from './typed-json';

const codec: DecodeCodec = {
  timestamp: (seconds, nanoseconds) => ({
    seconds,
    nanoseconds,
    toDate: (): Date => new Date(seconds * 1000),
  }),
  geopoint: (latitude, longitude) => ({
    latitude,
    longitude,
    isEqual: (): boolean => false,
  }),
  bytes: (base64) => Buffer.from(base64, 'base64'),
  reference: (referencePath) => ({
    path: referencePath,
    id: referencePath.split('/').pop() ?? referencePath,
    collection: (): undefined => undefined,
  }),
};

describe('typed json', () => {
  const samples: unknown[] = [
    { nullValue: null },
    { booleanValue: true },
    { booleanValue: false },
    { integerValue: '42' },
    { doubleValue: 1.5 },
    { stringValue: 'hello' },
    { bytesValue: Buffer.from('abc').toString('base64') },
    { timestampValue: '2020-01-02T03:04:05.123456789Z' },
    { geoPointValue: { latitude: 10.5, longitude: -20 } },
    { referenceValue: 'projects/demo-portfolio-v2/databases/(default)/documents/skills-section/doc-1' },
    { arrayValue: { values: [{ stringValue: 'a' }, { integerValue: '1' }] } },
    { mapValue: { fields: { name: { stringValue: 'ada' }, empty: { nullValue: null } } } },
    { arrayValue: {} },
    { mapValue: {} },
  ];

  it.each(samples)('should round-trip %j', (sample) => {
    const encoded = encodeTypedValue(sample, 'rest');
    const decoded = decodeTypedValue(encoded, codec);
    expect(encodeTypedValue(decoded, 'admin')).toEqual(encoded);
  });

  it('should keep timestamp nanoseconds', () => {
    const encoded = encodeTypedValue({ timestampValue: '2020-01-02T03:04:05.123456789Z' }, 'rest');
    expect(encoded).toMatchObject({ type: 'timestamp', nanoseconds: 123456789 });
  });

  it('should store a reference as a document path', () => {
    const encoded = encodeTypedValue({
      referenceValue: 'projects/portfolio-c9b8e/databases/(default)/documents/skills-section/doc-1',
    }, 'rest');
    expect(encoded).toEqual({ type: 'reference', path: 'skills-section/doc-1' });
  });

  it('should reject a rest value with no type', () => {
    expect(() => encodeTypedValue({ unexpected: true }, 'rest')).toThrow(/type keys/);
  });

  it('should hash a collection the same way when document order changes', () => {
    const first = document('b', 'beta');
    const second = document('a', 'alpha');
    expect(canonicalCollectionHash([first, second])).toBe(canonicalCollectionHash([second, first]));
  });

  it('should change the hash when a field changes', () => {
    const original = [document('a', 'alpha')];
    const edited = [document('a', 'beta')];
    expect(canonicalCollectionHash(original)).not.toBe(canonicalCollectionHash(edited));
  });

  it('should parse a collection file', () => {
    const encoded = encodeTypedValue({ mapValue: { fields: { title: { stringValue: 'Hello' } } } }, 'rest');
    const parsed = parseBaselineDocuments([{ id: 'doc-1', data: encoded }]);
    expect(parsed).toEqual([{ id: 'doc-1', data: encoded }]);
  });
});

function document(id: string, title: string): BaselineDocument {
  return {
    id,
    data: {
      type: 'map',
      fields: {
        title: { type: 'string', value: title },
      },
    },
  };
}
