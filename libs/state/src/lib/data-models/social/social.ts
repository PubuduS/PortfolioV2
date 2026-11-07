/** Firestore collection that holds LinkedIn, GitHub, and the contact email. */
export const SOCIAL_COLLECTION = 'social-infor-section';

/** Stable ids for the three contact links. */
export const SOCIAL_LINK_IDS = {
  linkedin: 1,
  github: 2,
  email: 3,
} as const;

/** Icons stored beside each contact link. */
export const SOCIAL_LINK_ICONS = {
  linkedin: 'fa-linkedin',
  github: 'fa-github',
  email: 'fa-envelope',
} as const;

/**
 * Firestore document path for one contact link.
 * @param id Link id, such as 1 for LinkedIn.
 * @returns Path such as `social-infor-section/social-01`.
 */
export function socialDocPath(id: number): string {
  return `${SOCIAL_COLLECTION}/social-${String(id).padStart(2, '0')}`;
}
