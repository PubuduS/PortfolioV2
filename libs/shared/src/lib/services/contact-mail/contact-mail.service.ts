import {
  Injectable,
  inject,
} from '@angular/core';
import {
  Functions,
  httpsCallable,
} from '@angular/fire/functions';
import { FirebaseError } from 'firebase/app';

/** Fields the contact form is allowed to send. */
export interface ContactMailRequest {
  email: string;
  name: string;
  message: string;
  faxNumber: string;
}

/** Outcome the form can show after a send attempt. */
export type ContactSendStatus = 'sent' | 'dry-run' | 'limited' | 'invalid' | 'failed';

interface ContactMailResponse {
  accepted: true;
  dryRun: boolean;
}

/**
 * Sends the contact form through the `sendContactMessage` callable.
 * The function chooses the recipient, the subject, and whether the send is allowed.
 */
@Injectable({
  providedIn: 'root',
})
export class ContactMailService {
  /** Cloud Functions instance for this build. */
  private readonly functions = inject(Functions);

  /** Callable that delivers one contact message. */
  private readonly submit = httpsCallable<ContactMailRequest, ContactMailResponse>(
    this.functions,
    'sendContactMessage',
  );

  /**
   * Delivers one message.
   * @param request Visitor details from the form.
   * @returns A status the form can show. Transport details stay on the server.
   */
  public async sendMessage(request: ContactMailRequest): Promise<ContactSendStatus> {
    try {
      const result = await this.submit(request);
      return result.data.dryRun
        ? 'dry-run'
        : 'sent';
    } catch (error: unknown) {
      return this.statusFor(error);
    }
  }

  /**
   * Maps a callable failure to a status the form can show.
   * @param error Failure from the callable.
   * @returns The matching status.
   */
  private statusFor(error: unknown): Exclude<ContactSendStatus, 'sent' | 'dry-run'> {
    if (error instanceof FirebaseError) {
      if (error.code === 'functions/resource-exhausted') {
        return 'limited';
      }
      if (error.code === 'functions/invalid-argument') {
        return 'invalid';
      }
    }
    return 'failed';
  }
}
