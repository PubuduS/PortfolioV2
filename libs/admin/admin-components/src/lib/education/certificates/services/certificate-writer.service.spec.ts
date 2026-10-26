import { createSpyObj } from 'jest-createspyobj';

import { ICertificateCard } from '@portfolio-v2/state/dataModels';
import {
  AuthService,
  SetDataService,
} from '@portfolio-v2/shared/services';
import {
  CertificateWriteError,
  certificateWriteMessage,
  CertificateWriter,
} from './certificate-writer.service';

/** A certificate to write. */
const certificate: ICertificateCard = {
  id: 8,
  title: 'Angular Level 2 Certification',
  completedDate: '03/01/2025',
  organization: 'Angular Training',
  credentialID: 'ABC123',
  certification: 'Here',
  certificateURL: 'https://example.com/certificate',
  description: 'An advanced certification.',
};

describe('CertificateWriter', () => {
  let setData: jest.Mocked<SetDataService>;
  let auth: jest.Mocked<AuthService>;
  let writer: CertificateWriter;

  beforeEach(() => {
    setData = createSpyObj(SetDataService);
    auth = createSpyObj(AuthService);

    setData.commit.mockResolvedValue(undefined);
    auth.isUserLoggedIn.mockReturnValue(true);

    writer = new CertificateWriter(setData, auth);
  });

  describe('when nobody is signed in', () => {
    beforeEach(() => {
      auth.isUserLoggedIn.mockReturnValue(false);
    });

    it('should not commit a save', async () => {
      await expect(writer.save(certificate)).rejects.toBeInstanceOf(CertificateWriteError);
      await expect(writer.save(certificate)).rejects.toMatchObject({ reason: 'unauthenticated' });
      expect(setData.commit).not.toHaveBeenCalled();
    });

    it('should not commit a delete', async () => {
      await expect(writer.remove(certificate)).rejects.toMatchObject({ reason: 'unauthenticated' });
      expect(setData.commit).not.toHaveBeenCalled();
    });
  });

  describe('save', () => {
    it('should set the document at the path for its id in one batch', async () => {
      const saved = await writer.save(certificate);

      expect(setData.commit).toHaveBeenCalledTimes(1);
      expect(setData.commit).toHaveBeenCalledWith([
        { kind: 'set', path: 'certification-section/certification-08', value: certificate },
      ]);
      expect(saved).toBe(certificate);
    });

    it('should report a failed batch as commit-failed and keep the cause', async () => {
      const cause = new Error('unavailable');
      setData.commit.mockRejectedValue(cause);

      await expect(writer.save(certificate)).rejects.toMatchObject({
        reason: 'commit-failed',
        cause,
      });
    });
  });

  describe('remove', () => {
    it('should delete the document at the path for its id in one batch', async () => {
      await writer.remove(certificate);

      expect(setData.commit).toHaveBeenCalledTimes(1);
      expect(setData.commit).toHaveBeenCalledWith([
        { kind: 'delete', path: 'certification-section/certification-08' },
      ]);
    });

    it('should report a failed batch as commit-failed', async () => {
      setData.commit.mockRejectedValue(new Error('unavailable'));

      await expect(writer.remove(certificate)).rejects.toMatchObject({
        reason: 'commit-failed',
      });
    });
  });
});

describe('certificateWriteMessage', () => {
  it('should ask for a sign in when the write was unauthenticated', () => {
    expect(certificateWriteMessage(new CertificateWriteError('unauthenticated')))
      .toBe('Sign in before changing certificates.');
  });

  it.each([
    new CertificateWriteError('commit-failed'),
    new Error('anything else'),
    'not an error',
  ])('should use the generic message for %p', (error) => {
    expect(certificateWriteMessage(error)).toBe('The certificate could not be saved.');
  });
});
