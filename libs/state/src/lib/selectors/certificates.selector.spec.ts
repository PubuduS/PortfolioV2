import { ICertificateCard } from '../data-models';
import {
  certificatesSelector,
  nextCertificateIdSelector,
} from './certificates.selector';

/**
 * @param id certificate id
 * @returns a stored certificate
 */
function certificate(id: number): ICertificateCard {
  return {
    id,
    title: `Certificate ${id}`,
    completedDate: 'In progress',
    organization: 'Udemy',
    credentialID: 'None',
    certification: 'In Progress',
    certificateURL: '',
    description: 'Description',
  };
}

describe('certificate selectors', () => {
  describe('certificatesSelector', () => {
    it('should return the certificates from the state', () => {
      const certificates = [certificate(2), certificate(1)];

      expect(certificatesSelector.projector({ certificates })).toBe(certificates);
    });
  });

  describe('nextCertificateIdSelector', () => {
    it('should be 1 before the collection has loaded', () => {
      expect(nextCertificateIdSelector.projector(undefined)).toBe(1);
    });

    it('should be one past the largest id regardless of order', () => {
      expect(nextCertificateIdSelector.projector([certificate(7), certificate(3)])).toBe(8);
    });
  });
});
