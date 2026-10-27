import { createSpyObj } from 'jest-createspyobj';

import { IEducation } from '@portfolio-v2/state/dataModels';
import {
  AuthService,
  SetDataService,
} from '@portfolio-v2/shared/services';
import {
  DegreeWriteError,
  degreeWriteMessage,
  DegreeWriter,
} from './degree-writer.service';

/** A degree to write. */
const degree: IEducation = {
  id: 4,
  title: 'Example University',
  period: '2023 - 2025',
  degree: 'DOCTOR OF PHILOSOPHY (PhD) IN COMPUTER SCIENCE',
  gpa: '4.0',
  awards: 'Fall 2024',
  credits: '60/60',
  graduated: '01st of May 2025',
  extra: '',
};

describe('DegreeWriter', () => {
  let setData: jest.Mocked<SetDataService>;
  let auth: jest.Mocked<AuthService>;
  let writer: DegreeWriter;

  beforeEach(() => {
    setData = createSpyObj(SetDataService);
    auth = createSpyObj(AuthService);

    setData.commit.mockResolvedValue(undefined);
    auth.isUserLoggedIn.mockReturnValue(true);

    writer = new DegreeWriter(setData, auth);
  });

  describe('when nobody is signed in', () => {
    beforeEach(() => {
      auth.isUserLoggedIn.mockReturnValue(false);
    });

    it('should not commit a save', async () => {
      await expect(writer.save(degree)).rejects.toBeInstanceOf(DegreeWriteError);
      await expect(writer.save(degree)).rejects.toMatchObject({ reason: 'unauthenticated' });
      expect(setData.commit).not.toHaveBeenCalled();
    });

    it('should not commit a delete', async () => {
      await expect(writer.remove(degree)).rejects.toMatchObject({ reason: 'unauthenticated' });
      expect(setData.commit).not.toHaveBeenCalled();
    });
  });

  describe('save', () => {
    it('should set the document at the path for its id in one batch', async () => {
      const saved = await writer.save(degree);

      expect(setData.commit).toHaveBeenCalledTimes(1);
      expect(setData.commit).toHaveBeenCalledWith([
        { kind: 'set', path: 'education-section/institute-04', value: degree },
      ]);
      expect(saved).toBe(degree);
    });

    it('should report a failed batch as commit-failed and keep the cause', async () => {
      const cause = new Error('unavailable');
      setData.commit.mockRejectedValue(cause);

      await expect(writer.save(degree)).rejects.toMatchObject({
        reason: 'commit-failed',
        cause,
      });
    });
  });

  describe('remove', () => {
    it('should delete the document at the path for its id in one batch', async () => {
      await writer.remove(degree);

      expect(setData.commit).toHaveBeenCalledTimes(1);
      expect(setData.commit).toHaveBeenCalledWith([
        { kind: 'delete', path: 'education-section/institute-04' },
      ]);
    });

    it('should report a failed batch as commit-failed', async () => {
      setData.commit.mockRejectedValue(new Error('unavailable'));

      await expect(writer.remove(degree)).rejects.toMatchObject({
        reason: 'commit-failed',
      });
    });
  });
});

describe('degreeWriteMessage', () => {
  it('should ask for a sign in when the write was unauthenticated', () => {
    expect(degreeWriteMessage(new DegreeWriteError('unauthenticated')))
      .toBe('Sign in before changing degrees.');
  });

  it.each([
    new DegreeWriteError('commit-failed'),
    new Error('anything else'),
    'not an error',
  ])('should use the generic message for %p', (error) => {
    expect(degreeWriteMessage(error)).toBe('The degree could not be saved.');
  });
});
