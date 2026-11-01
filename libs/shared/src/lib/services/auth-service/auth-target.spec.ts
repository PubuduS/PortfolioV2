import {
  AUTH_TARGET_STORAGE_KEY,
  authAppName,
  resolveAuthTarget,
  sessionMatchesAuthTarget,
} from './auth-target';

describe('auth target', () => {
  describe('when the build uses emulators', () => {
    it('should trust only the emulator', () => {
      expect(resolveAuthTarget(true)).toBe('emulator');
    });

    it('should keep the emulator app name apart from live', () => {
      expect(authAppName('emulator')).not.toBe(authAppName('live'));
      expect(authAppName('emulator')).toBe('portfolio-emulator');
    });
  });

  describe('when the build uses the live project', () => {
    it('should trust only live auth', () => {
      expect(resolveAuthTarget(false)).toBe('live');
      expect(authAppName('live')).toBe('portfolio-live');
    });
  });

  describe('when a session comes from the other backend', () => {
    it('should reject an emulator user on a live build', () => {
      expect(sessionMatchesAuthTarget('live', { host: '127.0.0.1' })).toBe(false);
    });

    it('should reject a live user on an emulator build', () => {
      expect(sessionMatchesAuthTarget('emulator', null)).toBe(false);
    });

    it('should accept a user from the connected backend', () => {
      expect(sessionMatchesAuthTarget('emulator', { host: '127.0.0.1' })).toBe(true);
      expect(sessionMatchesAuthTarget('live', null)).toBe(true);
    });
  });

  it('should keep the auth target marker stable', () => {
    expect(AUTH_TARGET_STORAGE_KEY).toBe('portfolio-v2.auth-target');
  });
});
