/** Project card interface */
export interface IProjectCard {
  /** ID */
  id: number,
  /** Heading */
  heading: string;
  /** Description */
  description: string;
  /** Tools */
  tools: string;
  /** Image URL */
  imageURL: string;
  /** GitHub URL */
  githubURL?: string,
  /** Is Git URL Disabled? */
  gitDisable?: boolean,
  /** Demo URL */
  demoURL?: string,
  /** Is Demo URL Disabled? */
  demoDisable?: boolean,
  /** Documentation URL */
  documentationURL?: string,
  /** Is Documents URL Disabled? */
  docDisable?: boolean,
  /** Scareenshot URL */
  screenshotURL?: string,
  /** Is Screen Shot URL Disabled? */
  ssDisable?: boolean
}

/** Project view interface */
export interface IProjectView {
  /** ID */
  id: number,
  /** Image URL */
  imageURL: string;
  /** Heaidng */
  viewHeading: string;
  /** Bried description */
  viewDescription: string;
}
