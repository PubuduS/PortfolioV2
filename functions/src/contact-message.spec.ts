import {
  type AddressedMail,
  type ContactDependencies,
  DAY_MS,
  GLOBAL_PER_DAY,
  GLOBAL_PER_HOUR,
  HOUR_MS,
  OWNER_EMAIL,
  PER_EMAIL_PER_HOUR,
  PER_IP_PER_HOUR,
  SUBJECT_PREFIX,
  acceptContactMessage,
  addressedMail,
  callerAddress,
  consumeQuota,
  guardDocumentId,
  parseContact,
  readBucket,
  type UsageBucket,
} from './contact-message';

const NOW = 1_700_000_000_000;

const validPayload = {
  email: 'Ada@Example.com',
  name: 'Ada',
  message: 'Hello from the contact form.',
  faxNumber: '',
};

describe('parseContact', () => {
  it('should accept a trimmed message and lowercase the email', () => {
    expect(parseContact(validPayload)).toEqual({
      kind: 'ok',
      contact: {
        email: 'ada@example.com',
        name: 'Ada',
        message: 'Hello from the contact form.',
      },
    });
  });

  it('should ignore a recipient supplied by the caller', () => {
    const parsed = parseContact({
      ...validPayload,
      to: 'someone.else@example.com',
      subject: 'Invoice',
    });
    expect(parsed.kind).toBe('ok');
  });

  describe('when the fax field is filled', () => {
    it('should treat the request as a bot', () => {
      expect(parseContact({
        ...validPayload,
        faxNumber: '555-0100',
      })).toEqual({ kind: 'honeypot' });
    });
  });

  describe('when the payload is not a message', () => {
    it.each([
      null,
      [],
      'hello',
      { email: 'not-an-email', name: 'Ada', message: 'Hello from the contact form.' },
      { email: 'ada@example.com', name: 'A', message: 'Hello from the contact form.' },
      { email: 'ada@example.com', name: 'Ada Lovelace', message: 'Hello from the contact form.' },
      { email: 'ada@example.com', name: 'Ada', message: 'short' },
      { email: 'ada@example.com\nBcc: spam@example.com', name: 'Ada', message: 'Hello from the contact form.' },
    ])('should reject %p', (payload) => {
      expect(parseContact(payload)).toEqual({ kind: 'invalid' });
    });
  });

  describe('when the message is mostly links', () => {
    it('should reject it', () => {
      const links = Array.from({ length: 6 }, (_, index) => `https://example.com/${index}`).join(' ');
      expect(parseContact({
        ...validPayload,
        message: links,
      })).toEqual({ kind: 'invalid' });
    });
  });
});

describe('addressedMail', () => {
  it('should address the owner and mark the subject as coming from the site', () => {
    const mail = addressedMail({
      email: 'ada@example.com',
      name: 'Ada',
      message: 'Hello from the contact form.',
    });
    expect(mail.to).toBe(OWNER_EMAIL);
    expect(mail.from).toBe(`Portfolio site <${OWNER_EMAIL}>`);
    expect(mail.replyTo).toBe('ada@example.com');
    expect(mail.subject).toBe(`${SUBJECT_PREFIX} Message from Ada`);
    expect(mail.text).toContain('Hello from the contact form.');
    expect(mail.text).toContain('ada@example.com');
  });
});

describe('guardDocumentId', () => {
  it('should hide the raw email address', () => {
    const id = guardDocumentId('email', 'ada@example.com');
    expect(id.startsWith('email_')).toBe(true);
    expect(id).not.toContain('ada@example.com');
    expect(id).toBe(guardDocumentId('email', 'ada@example.com'));
  });
});

describe('callerAddress', () => {
  it('should use the first forwarded address', () => {
    expect(callerAddress('203.0.113.5, 10.0.0.1', '10.0.0.2')).toBe('203.0.113.5');
  });

  it('should fall back to the socket address', () => {
    expect(callerAddress(undefined, '203.0.113.8')).toBe('203.0.113.8');
  });

  it('should ignore an unknown address', () => {
    expect(callerAddress(undefined, 'unknown')).toBeUndefined();
  });
});

describe('readBucket', () => {
  it('should ignore a corrupt counter', () => {
    expect(readBucket({ windowStartMs: 'yesterday', count: 1 })).toBeUndefined();
  });
});

describe('consumeQuota', () => {
  it('should allow the first message', () => {
    const decision = consumeQuota({ nowMs: NOW, trackIp: true });
    expect(decision.allowed).toBe(true);
    expect(decision.hourly.count).toBe(1);
    expect(decision.email.count).toBe(1);
    expect(decision.ip?.count).toBe(1);
    expect(decision.daily.count).toBe(1);
  });

  describe('when one email address reaches its hourly limit', () => {
    it('should deny the next message without incrementing the other counters', () => {
      let email: UsageBucket | undefined;
      for (let sent = 0; sent < PER_EMAIL_PER_HOUR; sent += 1) {
        const decision = consumeQuota({
          nowMs: NOW,
          email,
          trackIp: false,
        });
        expect(decision.allowed).toBe(true);
        email = decision.email;
      }
      const denied = consumeQuota({
        nowMs: NOW,
        email,
        hourly: { windowStartMs: NOW, count: 1 },
        daily: { windowStartMs: NOW, count: 1 },
        trackIp: false,
      });
      expect(denied.allowed).toBe(false);
      expect(denied.hourly.count).toBe(1);
      expect(denied.daily.count).toBe(1);
    });
  });

  describe('when one address reaches its hourly limit', () => {
    it('should deny the next message', () => {
      let ip: UsageBucket | undefined;
      for (let sent = 0; sent < PER_IP_PER_HOUR; sent += 1) {
        const decision = consumeQuota({
          nowMs: NOW,
          ip,
          trackIp: true,
        });
        expect(decision.allowed).toBe(true);
        ip = decision.ip;
      }
      expect(consumeQuota({
        nowMs: NOW,
        ip,
        trackIp: true,
      }).allowed).toBe(false);
    });
  });

  describe('when the site reaches its hourly limit', () => {
    it('should deny the next message', () => {
      const denied = consumeQuota({
        nowMs: NOW,
        hourly: { windowStartMs: NOW, count: GLOBAL_PER_HOUR },
        trackIp: false,
      });
      expect(denied.allowed).toBe(false);
      expect(denied.hourly.count).toBe(GLOBAL_PER_HOUR);
    });
  });

  describe('when the hourly window has passed', () => {
    it('should start a new counter', () => {
      const decision = consumeQuota({
        nowMs: NOW + HOUR_MS,
        hourly: { windowStartMs: NOW, count: GLOBAL_PER_HOUR },
        trackIp: false,
      });
      expect(decision.allowed).toBe(true);
      expect(decision.hourly).toEqual({
        windowStartMs: NOW + HOUR_MS,
        count: 1,
      });
    });
  });

  describe('when the site reaches its daily limit', () => {
    it('should deny further messages until the next day', () => {
      const denied = consumeQuota({
        nowMs: NOW + HOUR_MS,
        hourly: { windowStartMs: NOW, count: GLOBAL_PER_HOUR },
        daily: { windowStartMs: NOW, count: GLOBAL_PER_DAY },
        trackIp: false,
      });
      expect(denied.allowed).toBe(false);
      const nextDay = consumeQuota({
        nowMs: NOW + DAY_MS,
        daily: { windowStartMs: NOW, count: GLOBAL_PER_DAY },
        trackIp: false,
      });
      expect(nextDay.allowed).toBe(true);
      expect(nextDay.daily.count).toBe(1);
    });
  });
});

describe('acceptContactMessage', () => {
  const contact = {
    email: 'ada@example.com',
    name: 'Ada',
    message: 'Hello from the contact form.',
  };

  function dependencies(overrides: Partial<ContactDependencies> = {}): ContactDependencies & {
    reserve: jest.Mock;
    send: jest.Mock;
  } {
    const reserve = jest.fn().mockResolvedValue(true);
    const send = jest.fn().mockResolvedValue(undefined);
    return {
      dryRun: false,
      reserve,
      send,
      ...overrides,
    } as ContactDependencies & {
      reserve: jest.Mock;
      send: jest.Mock;
    };
  }

  it('should send the addressed message after a slot is reserved', async () => {
    const deps = dependencies();
    await expect(acceptContactMessage(validPayload, '203.0.113.5', deps)).resolves.toEqual({
      accepted: true,
      dryRun: false,
    });
    expect(deps.reserve).toHaveBeenCalledWith(contact, '203.0.113.5');
    const mail = deps.send.mock.calls[0][0] as AddressedMail;
    expect(mail.to).toBe(OWNER_EMAIL);
    expect(mail.subject).toBe(`${SUBJECT_PREFIX} Message from Ada`);
    expect(mail.replyTo).toBe('ada@example.com');
  });

  describe('when the fax field is filled', () => {
    it('should accept the request without reserving or sending', async () => {
      const deps = dependencies();
      await expect(acceptContactMessage({
        ...validPayload,
        faxNumber: 'bot',
      }, '203.0.113.5', deps)).resolves.toEqual({
        accepted: true,
        dryRun: false,
      });
      expect(deps.reserve).not.toHaveBeenCalled();
      expect(deps.send).not.toHaveBeenCalled();
    });
  });

  describe('when the quota is exhausted', () => {
    it('should not send', async () => {
      const deps = dependencies({
        reserve: jest.fn().mockResolvedValue(false),
      });
      await expect(acceptContactMessage(validPayload, undefined, deps)).rejects.toMatchObject({
        code: 'limited',
      });
      expect(deps.send).not.toHaveBeenCalled();
    });
  });

  describe('when the quota store is down', () => {
    it('should not send', async () => {
      const deps = dependencies({
        reserve: jest.fn().mockRejectedValue(new Error('firestore down')),
      });
      await expect(acceptContactMessage(validPayload, undefined, deps)).rejects.toMatchObject({
        code: 'unavailable',
      });
      expect(deps.send).not.toHaveBeenCalled();
    });
  });

  describe('when mail delivery fails', () => {
    it('should report a failure', async () => {
      const deps = dependencies({
        send: jest.fn().mockRejectedValue(new Error('smtp down')),
      });
      await expect(acceptContactMessage(validPayload, undefined, deps)).rejects.toMatchObject({
        code: 'failed',
      });
    });
  });

  describe('when running locally without a mailbox password', () => {
    it('should reserve a slot and skip delivery', async () => {
      const deps = dependencies({ dryRun: true });
      await expect(acceptContactMessage(validPayload, undefined, deps)).resolves.toEqual({
        accepted: true,
        dryRun: true,
      });
      expect(deps.reserve).toHaveBeenCalled();
      expect(deps.send).not.toHaveBeenCalled();
    });
  });
});
