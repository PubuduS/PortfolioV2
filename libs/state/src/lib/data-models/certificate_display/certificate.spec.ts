import { ICertificateCard } from './ICertificateCard';
import {
  CertificateFormValues,
  certificateDocPath,
  nextCertificateId,
  toCertificateDraft,
} from './certificate';

/** Values for an earned certificate. */
const earned: CertificateFormValues = {
  title: 'Angular Level 1 Certification',
  organization: 'Angular Training',
  completedDate: '02/21/2024',
  credentialID: '5A20CF0',
  certification: 'Here',
  certificateURL: 'https://interstate21.com/certificate/?code=5A20CF0',
  description: 'A professional certification.',
};

describe('certificate model', () => {
  describe('certificateDocPath', () => {
    it.each([
      [1, 'certification-section/certification-01'],
      [7, 'certification-section/certification-07'],
      [12, 'certification-section/certification-12'],
      [123, 'certification-section/certification-123'],
    ])('should map id %i to %s', (id, expected) => {
      expect(certificateDocPath(id)).toBe(expected);
    });
  });

  describe('nextCertificateId', () => {
    it('should start at 1 when nothing has loaded', () => {
      expect(nextCertificateId(undefined)).toBe(1);
    });

    it('should start at 1 when the collection is empty', () => {
      expect(nextCertificateId([])).toBe(1);
    });

    it('should take one past the largest id even when ids have gaps', () => {
      expect(nextCertificateId([{ id: 7 }, { id: 2 }, { id: 4 }])).toBe(8);
    });

    it('should ignore ids that are not positive integers', () => {
      expect(nextCertificateId([{ id: 0 }, { id: -3 }, { id: 1.5 }, { id: 3 }])).toBe(4);
    });
  });

  describe('toCertificateDraft', () => {
    it('should build the stored record for an earned certificate', () => {
      expect(toCertificateDraft(8, earned)).toEqual({
        ok: true,
        certificate: {
          id: 8,
          title: 'Angular Level 1 Certification',
          organization: 'Angular Training',
          completedDate: '02/21/2024',
          credentialID: '5A20CF0',
          certification: 'Here',
          certificateURL: 'https://interstate21.com/certificate/?code=5A20CF0',
          description: 'A professional certification.',
        } satisfies ICertificateCard,
      });
    });

    it('should trim every text field', () => {
      const result = toCertificateDraft(1, {
        ...earned,
        title: '  Padded  ',
        organization: ' Org ',
        completedDate: ' 01/01/2020 ',
        credentialID: ' ABC ',
        certificateURL: ' https://example.com/c ',
        description: ' Text ',
      });

      expect(result).toMatchObject({
        ok: true,
        certificate: {
          title: 'Padded',
          organization: 'Org',
          completedDate: '01/01/2020',
          credentialID: 'ABC',
          certificateURL: 'https://example.com/c',
          description: 'Text',
        },
      });
    });

    it('should store None when the credential id is blank', () => {
      expect(toCertificateDraft(1, { ...earned, credentialID: '   ' })).toMatchObject({
        ok: true,
        certificate: { credentialID: 'None' },
      });
    });

    describe('when the certificate is in progress', () => {
      const inProgress: CertificateFormValues = {
        ...earned,
        completedDate: 'In progress',
        certification: 'In Progress',
        certificateURL: '',
      };

      it('should allow an empty link and store it as an empty string', () => {
        expect(toCertificateDraft(2, inProgress)).toMatchObject({
          ok: true,
          certificate: { certification: 'In Progress', certificateURL: '' },
        });
      });

      it('should still reject a link that is not a web url', () => {
        expect(toCertificateDraft(2, { ...inProgress, certificateURL: 'not a url' })).toEqual({
          ok: false,
          reason: 'invalid-url',
        });
      });
    });

    describe('when a rule fails', () => {
      it.each([0, -1, 1.5, Number.NaN])('should reject id %p', (id) => {
        expect(toCertificateDraft(id, earned)).toEqual({ ok: false, reason: 'invalid-id' });
      });

      it.each(['title', 'organization', 'completedDate', 'description'] as const)(
        'should reject a blank %s',
        (field) => {
          expect(toCertificateDraft(1, { ...earned, [field]: '  ' })).toEqual({
            ok: false,
            reason: 'missing-field',
          });
        },
      );

      it('should require a link once the certificate is earned', () => {
        expect(toCertificateDraft(1, { ...earned, certificateURL: ' ' })).toEqual({
          ok: false,
          reason: 'missing-url',
        });
      });

      it.each(['ftp://example.com/c', 'data:text/html,hello', 'example.com/c', 'nonsense'])(
        'should reject the link %s',
        (certificateURL) => {
          expect(toCertificateDraft(1, { ...earned, certificateURL })).toEqual({
            ok: false,
            reason: 'invalid-url',
          });
        },
      );
    });
  });
});
