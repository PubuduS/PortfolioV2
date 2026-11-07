import { mirrorUrl } from './mirror-url';

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
    ['/admin/coverletter', '/content/coverletter'],
    ['/content/coverletter', '/admin/coverletter'],
    ['/content/coverletter?draft=1', '/admin/coverletter'],
  ])('maps %s to %s', (url, mirrored) => {
    expect(mirrorUrl(url)).toBe(mirrored);
  });
});
