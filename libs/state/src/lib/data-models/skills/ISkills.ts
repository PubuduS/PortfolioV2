/** Skills interface */
export interface ISkills {
  /** ID */
  id: number,
  /** Brief introduction */
  intro: string,
  /** Languages column 1 */
  languagesCol1: { [key: string]: number },
  /** Languages column 2 */
  languagesCol2: { [key: string]: number },
  /** Tool heading */
  toolHeading: string,
  /** Left sub-heading */
  leftSubHeading: string,
  /** Framework array */
  framework: string[],
  /** Right sub-heading */
  rightSubHeading: string,
  /** Software array */
  software: string[]
}
