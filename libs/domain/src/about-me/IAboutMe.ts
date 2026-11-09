/** About me interface */
export interface IAboutMe {
  /** ID */
  id: number,
  /** URL of my photo */
  imageSrc: string,
  /** Brief introduction */
  intro: string[],
  /** Sub heading intro */
  subHeadingIntro: string,
  /** Left points */
  leftPoints: string[],
  /** Right points */
  rightPoints: string[],
  /** Optional: Link (Game play link) */
  link?: string,
}
