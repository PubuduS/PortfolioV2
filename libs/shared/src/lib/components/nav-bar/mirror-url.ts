/**
 * @param url router url
 * @returns the path with query, fragment, and a trailing slash removed
 */
function pathOnly(url: string): string {
  const hashIndex = url.indexOf('#');
  const queryIndex = url.indexOf('?');
  let end = url.length;
  if (hashIndex >= 0) {
    end = Math.min(end, hashIndex);
  }
  if (queryIndex >= 0) {
    end = Math.min(end, queryIndex);
  }
  const path = url.slice(0, end);
  if (path.length > 1 && path.endsWith('/')) {
    return path.slice(0, -1);
  }
  return path;
}

/**
 * Map an admin URL to its public twin, and a public URL to its admin twin.
 * Query and fragment are dropped. `/home` swaps with `/admin/home`.
 * Featured projects keep their current admin path under `portfolio`.
 * `/content/admin` is the login page and stays put.
 * @param url router url, including an optional query or fragment
 * @returns the mirrored path
 */
export function mirrorUrl(url: string): string {
  const path = pathOnly(url);
  if (path === '/content/admin') {
    return path;
  }
  if (path === '/home') {
    return '/admin/home';
  }
  if (path === '/admin/home') {
    return '/home';
  }
  const lastSegment = path.slice(path.lastIndexOf('/') + 1);
  if (lastSegment === 'featured-projects') {
    if (path.startsWith('/admin')) {
      return '/content/portfolio/featured-projects';
    }
    return '/admin/portfolio/featured-projects';
  }
  if (path === '/admin' || path.startsWith('/admin/')) {
    return `/content${path.slice('/admin'.length)}`;
  }
  if (path === '/content' || path.startsWith('/content/')) {
    return `/admin${path.slice('/content'.length)}`;
  }
  return path;
}
