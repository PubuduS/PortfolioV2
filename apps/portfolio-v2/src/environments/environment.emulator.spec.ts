import { environment } from './environment.emulator';

describe('emulator environment', () => {
  it('should never contain the live project id', () => {
    expect(JSON.stringify(environment)).not.toContain('portfolio-c9b8e');
  });

  it('should use a demo project id and bucket', () => {
    expect(environment.firebase.projectId).toMatch(/^demo-/);
    expect(environment.firebase.storageBucket).toMatch(/^demo-/);
  });

  it('should not be a production build', () => {
    expect(environment.production).toBe(false);
  });

  describe('when listing emulator endpoints', () => {
    const endpoints = Object.entries(environment.emulators ?? {});

    it('should define firestore, auth, and storage', () => {
      expect(endpoints.map(([name]) => name).sort()).toEqual(['auth', 'firestore', 'storage']);
    });

    it.each(endpoints)('should point %s at a localhost host', (_name, { host }) => {
      expect(['127.0.0.1', 'localhost']).toContain(host);
    });
  });
});
