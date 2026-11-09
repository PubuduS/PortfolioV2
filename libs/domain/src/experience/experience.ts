/** Firestore collection that holds one document per job. */
export const EXPERIENCE_COLLECTION = 'experience-section';

/**
 * Firestore document path for one job.
 * @param id job id
 * @returns path such as `experience-section/experience02/`
 */
export function experienceDocPath(id: number): string {
  return `${EXPERIENCE_COLLECTION}/experience${String(id).padStart(2, '0')}/`;
}
