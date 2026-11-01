import {
  ADMIN_IDLE_CHECK_MS,
  ADMIN_IDLE_TIMEOUT_MS,
} from './auth-target';

/** Clock used to decide when an admin session has gone idle. */
export interface IdleClock {
  now(): number;
  every(intervalMs: number, check: () => void): number;
  cancel(handle: number): void;
}

/** Activity signals that count as the admin still being present. */
export interface IdleActivity {
  listen(type: string, handler: () => void): void;
  forget(type: string, handler: () => void): void;
  onVisible(handler: () => void): void;
  offVisible(handler: () => void): void;
}

/** Activity events that count as the admin still being present. */
const ACTIVITY_EVENTS = ['pointerdown', 'keydown', 'scroll', 'touchstart'] as const;

/**
 * Clock backed by `Date` and `window` timers.
 * @returns The browser clock.
 */
function browserIdleClock(): IdleClock {
  return {
    now: () => Date.now(),
    every: (intervalMs, check) => window.setInterval(check, intervalMs),
    cancel: (handle) => window.clearInterval(handle),
  };
}

/**
 * Activity backed by window input and tab visibility.
 * @returns The browser activity source.
 */
function browserIdleActivity(): IdleActivity {
  return {
    listen: (type, handler) => window.addEventListener(type, handler, { passive: true }),
    forget: (type, handler) => window.removeEventListener(type, handler),
    onVisible: (handler) => document.addEventListener('visibilitychange', handler),
    offVisible: (handler) => document.removeEventListener('visibilitychange', handler),
  };
}

/**
 * Signs an admin session out after a stretch without input.
 * Activity resets the window. Hiding the tab does not.
 */
export class AdminIdleSession {
  /** Handle for the timeout. */
  private handle: number | null = null;

  /** Timestamp of the last activity. */
  private lastActivityAt = 0;

  /** Callback for activity events. */
  private readonly onActivity = (): void => {
    this.lastActivityAt = this.clock.now();
  };

  /** Callback for tab visibility events. */
  private readonly onVisible = (): void => {
    this.expireIfIdle();
  };

  /**
   * constructor
   * @param onTimeout Called once when the session has been idle for the full window.
   * @param timeoutMs Idle window. Defaults to five minutes.
   * @param checkEveryMs How often the window is checked.
   * @param clock Time source.
   * @param activity Input source.
   */
  constructor(
    private readonly onTimeout: () => void,
    private readonly timeoutMs = ADMIN_IDLE_TIMEOUT_MS,
    private readonly checkEveryMs = ADMIN_IDLE_CHECK_MS,
    private readonly clock: IdleClock = browserIdleClock(),
    private readonly activity: IdleActivity = browserIdleActivity(),
  ) {}

  /**
   * Starts watching for inactivity. A second call while a watch is already running does nothing.
   */
  public start(): void {
    if (this.handle !== null) {
      return;
    }
    this.lastActivityAt = this.clock.now();
    ACTIVITY_EVENTS.forEach((type) => this.activity.listen(type, this.onActivity));
    this.activity.onVisible(this.onVisible);
    this.handle = this.clock.every(this.checkEveryMs, () => this.expireIfIdle());
  }

  /**
   * Stops watching. The timeout callback is not called.
   */
  public stop(): void {
    if (this.handle === null) {
      return;
    }
    this.clock.cancel(this.handle);
    this.handle = null;
    ACTIVITY_EVENTS.forEach((type) => this.activity.forget(type, this.onActivity));
    this.activity.offVisible(this.onVisible);
  }

  /**
   * Expires the session if it has been idle for the full window.
   */
  private expireIfIdle(): void {
    if (this.handle === null) {
      return;
    }
    if (this.clock.now() - this.lastActivityAt < this.timeoutMs) {
      return;
    }
    this.stop();
    this.onTimeout();
  }
}
