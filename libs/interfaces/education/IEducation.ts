/** Interface for Education */
export interface IEducation {
  /** Id */
  id: number,
  /** Name of the institute */
  title: string,
  /** Time period */
  period: string,
  /** Degree name */
  degree: string,
  /** GPA */
  gpa: string,
  /** Awards */
  awards: string,
  /** Credits */
  credits: string,
  /** Graduated date */
  graduated: string,
  /** Extra */
  extra?: string,
}
