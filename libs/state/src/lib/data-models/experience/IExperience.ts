/** Interface for job experience */
export interface IExperience {
  /** Id */
  id: number,
  /** Name of the position */
  position: string,
  /** Name of the employer */
  employer: string,
  /** Total time period. Ex: 2025 - present */
  timePeriod: string,
  /** Short description of job duties */
  shortDescription: string,
  /** Job responsibilities in point form */
  points: string[],
  /** Start date */
  startDate: string,
  /** End date */
  endDate: string,
  /** Is this my current job */
  isCurrent?: boolean,
}
