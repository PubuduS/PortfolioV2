import {
  mirrorUrl,
  modeUrl,
  navSectionPaths,
} from './mirror-url';

describe('mirrorUrl', () => {
  it.each([
    ['/home', '/admin/home'],
    ['/admin/home', '/home'],
    ['/home?tab=1', '/admin/home'],
    ['/admin/home#top', '/home'],
    ['/content/aboutme', '/admin/aboutme'],
    ['/admin/aboutme/', '/content/aboutme'],
    ['/content/contact', '/admin/contact'],
    ['/admin/contact', '/content/contact'],
    ['/content/portfolio/featured-projects', '/admin/portfolio/featured-projects'],
    ['/admin/portfolio/featured-projects', '/content/portfolio/featured-projects'],
    ['/content/featured-projects', '/admin/portfolio/featured-projects'],
    ['/admin/education/publications?edit=3', '/content/education/publications'],
    ['/content/education/publications?edit=3#paper', '/admin/education/publications'],
    ['/content/education/degrees', '/admin/education/degrees'],
    ['/admin/education/degrees?edit=2', '/content/education/degrees'],
    ['/content/admin', '/content/admin'],
    ['/content/admin?next=/home', '/content/admin'],
    ['/admin/resume', '/home'],
    ['/admin/resume?from=nav', '/home'],
    ['/admin/analytics', '/home'],
    ['/admin/analytics?from=nav', '/home'],
    ['/admin/coverletter', '/content/coverletter'],
    ['/content/coverletter', '/admin/coverletter'],
    ['/content/coverletter?draft=1', '/admin/coverletter'],
  ])('maps %s to %s', (url, mirrored) => {
    expect(mirrorUrl(url)).toBe(mirrored);
  });
});

describe('navSectionPaths', () => {
  describe('when the admin is not previewing', () => {
    it('should use the admin pages', () => {
      expect(navSectionPaths(true, false)).toEqual({
        home: '/admin/home',
        about: '/admin/aboutme',
        skills: '/admin/skills',
        experience: '/admin/experience',
        portfolio: '/admin/portfolio',
        education: '/admin/education',
        contact: '/admin/contact',
      });
    });
  });

  describe('when preview is on', () => {
    it('should use the public pages', () => {
      expect(navSectionPaths(true, true).skills).toBe('/content/skills');
      expect(navSectionPaths(true, true).home).toBe('/home');
    });
  });
});

describe('modeUrl', () => {
  describe('when preview is off', () => {
    it.each([
      ['/content/skills', '/admin/skills'],
      ['/home', '/admin/home'],
      ['/content/education/publications', '/admin/education/publications'],
    ])('should send %s to %s', (url, target) => {
      expect(modeUrl(url, false)).toBe(target);
    });

    it('should leave an admin page and the login page', () => {
      expect(modeUrl('/admin/skills', false)).toBeNull();
      expect(modeUrl('/admin/analytics', false)).toBeNull();
      expect(modeUrl('/content/admin', false)).toBeNull();
      expect(modeUrl('/content/party-mode', false)).toBeNull();
    });
  });

  describe('when preview is on', () => {
    it('should send an admin page to its public page', () => {
      expect(modeUrl('/admin/aboutme', true)).toBe('/content/aboutme');
      expect(modeUrl('/admin/home', true)).toBe('/home');
      expect(modeUrl('/admin/analytics', true)).toBe('/home');
    });

    it('should leave a public page', () => {
      expect(modeUrl('/content/aboutme', true)).toBeNull();
    });
  });
});
