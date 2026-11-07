import { mirrorDocumentPath } from '@portfolio-v2/state/dataModels';

/**
 * Keep only the path of a router URL.
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
  const documents = mirrorDocumentPath(path);
  if (documents !== null) {
    return documents;
  }
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

/** Pages that exist only on the public site. */
const PUBLIC_ONLY_PREFIXES = ['/content/admin', '/content/party-mode'] as const;

/** Nav destinations that have an admin editor and a public page. */
export interface NavSectionPaths {
  /** Landing page. */
  home: string;
  /** About page. */
  about: string;
  /** Skills page. */
  skills: string;
  /** Experience page. */
  experience: string;
  /** Portfolio page. */
  portfolio: string;
  /** Education hub. */
  education: string;
  /** Contact page. */
  contact: string;
}

/**
 * Where the main nav should go for the signed-in mode.
 * Admin mode uses the editors. Preview mode and visitors use the public pages.
 * @param isAdmin store flag, including while preview mode is on
 * @param isPreview preview mode
 * @returns Absolute paths for the section links.
 */
export function navSectionPaths(isAdmin: boolean, isPreview: boolean): NavSectionPaths {
  const editing = isAdmin && !isPreview;
  const root = editing ? '/admin' : '/content';
  return {
    home: editing ? '/admin/home' : '/home',
    about: `${root}/aboutme`,
    skills: `${root}/skills`,
    experience: `${root}/experience`,
    portfolio: `${root}/portfolio`,
    education: `${root}/education`,
    contact: `${root}/contact`,
  };
}

/**
 * Replacement path when the open URL does not match the signed-in mode.
 * @param url router url, including an optional query or fragment
 * @param isPreview preview mode
 * @returns The matching admin or public path, or null when the URL should stay.
 */
export function modeUrl(url: string, isPreview: boolean): string | null {
  const path = pathOnly(url);
  if (PUBLIC_ONLY_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`))) {
    return null;
  }
  const mirrored = mirrorUrl(url);
  if (mirrored === path) {
    return null;
  }
  const onAdmin = path === '/admin' || path.startsWith('/admin/');
  const onPublic = path === '/home' || path === '/content' || path.startsWith('/content/');
  if (!isPreview && onPublic) {
    return mirrored;
  }
  if (isPreview && onAdmin) {
    return mirrored;
  }
  return null;
}
