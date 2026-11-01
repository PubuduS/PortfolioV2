import {
  ADMIN_IDLE_CHECK_MS,
  ADMIN_IDLE_TIMEOUT_MS,
} from './auth-target';
import {
  AdminIdleSession,
  type IdleActivity,
  type IdleClock,
} from './admin-idle-session';

describe('AdminIdleSession', () => {
  let now: number;
  let check: (() => void) | null;
  let handlers: Map<string, () => void>;
  let visible: (() => void) | null;
  let onTimeout: jest.Mock;
  let session: AdminIdleSession;

  beforeEach(() => {
    now = 1_000;
    check = null;
    handlers = new Map();
    visible = null;
    onTimeout = jest.fn();
    const clock: IdleClock = {
      now: () => now,
      every: (_intervalMs, callback) => {
        check = callback;
        return 1;
      },
      cancel: () => {
        check = null;
      },
    };
    const activity: IdleActivity = {
      listen: (type, handler) => {
        handlers.set(type, handler);
      },
      forget: (type) => {
        handlers.delete(type);
      },
      onVisible: (handler) => {
        visible = handler;
      },
      offVisible: () => {
        visible = null;
      },
    };
    session = new AdminIdleSession(
      onTimeout,
      ADMIN_IDLE_TIMEOUT_MS,
      ADMIN_IDLE_CHECK_MS,
      clock,
      activity,
    );
  });

  function expireCheck(): void {
    if (!check) {
      throw new Error('idle session is not watching');
    }
    check();
  }

  describe('when the admin is still working', () => {
    it('should keep the session inside the five minute window', () => {
      session.start();
      now += ADMIN_IDLE_TIMEOUT_MS - 1;

      expireCheck();

      expect(onTimeout).not.toHaveBeenCalled();
    });

    it('should restart the window after input', () => {
      session.start();
      now += ADMIN_IDLE_TIMEOUT_MS - 1;
      handlers.get('keydown')?.();
      now += ADMIN_IDLE_TIMEOUT_MS - 1;

      expireCheck();

      expect(onTimeout).not.toHaveBeenCalled();
    });

    it.each(['pointerdown', 'keydown', 'scroll', 'touchstart'])(
      'should treat %s as activity',
      (type) => {
        session.start();
        now += ADMIN_IDLE_TIMEOUT_MS - 1;
        handlers.get(type)?.();
        now += ADMIN_IDLE_TIMEOUT_MS - 1;

        expireCheck();

        expect(onTimeout).not.toHaveBeenCalled();
      },
    );
  });

  describe('when five minutes pass without input', () => {
    it('should sign the session out once', () => {
      session.start();
      const tick = check;
      now += ADMIN_IDLE_TIMEOUT_MS;

      tick?.();
      tick?.();

      expect(onTimeout).toHaveBeenCalledTimes(1);
    });

    it('should sign the session out when the tab becomes visible after the window', () => {
      session.start();
      now += ADMIN_IDLE_TIMEOUT_MS;

      visible?.();

      expect(onTimeout).toHaveBeenCalledTimes(1);
    });
  });

  describe('when the session stops', () => {
    it('should ignore a later check', () => {
      session.start();
      session.stop();
      now += ADMIN_IDLE_TIMEOUT_MS;

      expect(check).toBeNull();
      expect(onTimeout).not.toHaveBeenCalled();
    });

    it('should allow a later session to watch again', () => {
      session.start();
      session.stop();
      session.start();
      now += ADMIN_IDLE_TIMEOUT_MS;

      expireCheck();

      expect(onTimeout).toHaveBeenCalledTimes(1);
    });
  });
});
