import { TestBed } from '@angular/core/testing';
import {
  Functions,
  httpsCallable,
} from '@angular/fire/functions';
import { FirebaseError } from 'firebase/app';

import { ContactMailService } from './contact-mail.service';

jest.mock('@angular/fire/functions', () => {
  const actual = jest.requireActual('@angular/fire/functions');
  return {
    ...actual,
    httpsCallable: jest.fn(),
  };
});

const request = {
  email: 'ada@example.com',
  name: 'Ada',
  message: 'Hello from the contact form.',
  faxNumber: '',
};

describe('ContactMailService', () => {
  let service: ContactMailService;
  let submit: jest.Mock;

  beforeEach(() => {
    submit = jest.fn();
    (httpsCallable as jest.Mock).mockReturnValue(submit);
    TestBed.configureTestingModule({
      providers: [
        { provide: Functions, useValue: {} },
      ],
    });
    service = TestBed.inject(ContactMailService);
  });

  it('should call sendContactMessage', () => {
    expect(httpsCallable).toHaveBeenCalledWith({}, 'sendContactMessage');
  });

  describe('when the function accepts the message', () => {
    it('should report that it was sent', async () => {
      submit.mockResolvedValue({ data: { accepted: true, dryRun: false } });
      await expect(service.sendMessage(request)).resolves.toBe('sent');
      expect(submit).toHaveBeenCalledWith(request);
    });
  });

  describe('when the local emulator is not sending mail', () => {
    it('should report a dry run', async () => {
      submit.mockResolvedValue({ data: { accepted: true, dryRun: true } });
      await expect(service.sendMessage(request)).resolves.toBe('dry-run');
    });
  });

  describe('when the function is rate limiting', () => {
    it('should report that the visitor should wait', async () => {
      submit.mockRejectedValue(new FirebaseError('functions/resource-exhausted', 'slow'));
      await expect(service.sendMessage(request)).resolves.toBe('limited');
    });
  });

  describe('when the function rejects the payload', () => {
    it('should report that the form needs another look', async () => {
      submit.mockRejectedValue(new FirebaseError('functions/invalid-argument', 'bad'));
      await expect(service.sendMessage(request)).resolves.toBe('invalid');
    });
  });

  describe('when the function is unreachable', () => {
    it('should report a failure', async () => {
      submit.mockRejectedValue(new Error('offline'));
      await expect(service.sendMessage(request)).resolves.toBe('failed');
    });
  });
});
