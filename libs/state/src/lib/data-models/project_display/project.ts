/** Firestore collection that holds the portfolio tiles. */
export const PROJECT_ICON_COLLECTION = 'project-icon-section';

/** Firestore collection that holds project cards that are not featured. */
export const PROJECT_DATA_COLLECTION = 'project-data-section';

/** Firestore collection that holds featured project cards. */
export const FEATURED_PROJECT_COLLECTION = 'featured-project-section';

/**
 * Pad a record id the way the stored document names do.
 * @param id record id
 * @returns two digits, such as `03`
 */
function paddedId(id: number): string {
  return String(id).padStart(2, '0');
}

/**
 * Firestore document path for a portfolio tile.
 * @param id tile id
 * @returns path such as `project-icon-section/project-03/`
 */
export function projectIconDocPath(id: number): string {
  return `${PROJECT_ICON_COLLECTION}/project-${paddedId(id)}/`;
}

/**
 * Firestore document path for a standard project card.
 * @param id card id
 * @returns path such as `project-data-section/project-03/`
 */
export function projectDataDocPath(id: number): string {
  return `${PROJECT_DATA_COLLECTION}/project-${paddedId(id)}/`;
}

/**
 * Firestore document path for a featured project card.
 * @param id card id
 * @returns path such as `featured-project-section/project-03/`
 */
export function featuredProjectDocPath(id: number): string {
  return `${FEATURED_PROJECT_COLLECTION}/project-${paddedId(id)}/`;
}

/**
 * Storage path for a portfolio tile icon.
 * @param id tile id
 * @returns storage path
 */
export function projectIconFilePath(id: number): string {
  return `portfolio/portfolio-tiles/ID-${paddedId(id)}-Icon.webp`;
}

/**
 * Storage path for a project screenshot.
 * @param id card id
 * @param featured true for the featured screenshot folder
 * @returns storage path
 */
export function projectScreenshotFilePath(id: number, featured: boolean): string {
  const folder = featured ? 'featured' : 'normal';
  return `portfolio/project-screenshots/${folder}/ID-${paddedId(id)}-Screenshot.webp`;
}

/**
 * Storage path for a project card image.
 * Featured and standard cards use different folders, and both keep the trailing slash.
 * @param id card id
 * @param featured true for a featured project image
 * @returns storage path
 */
export function projectCardImageFilePath(id: number, featured: boolean): string {
  const folder = featured ? 'featured-projects' : 'project-card-images';
  return `portfolio/${folder}/ID-${paddedId(id)}-Image.webp/`;
}
