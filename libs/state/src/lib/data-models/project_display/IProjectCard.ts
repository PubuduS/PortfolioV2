export interface IProjectCard {
  id: number,
  heading: string;
  description: string;
  tools: string;
  imageURL: string;
  githubURL?: string,
  gitDisable?: boolean,
  demoURL?: string,
  demoDisable?: boolean,
  documentationURL?: string,
  docDisable?: boolean,
  screenshotURL?: string,
  ssDisable?: boolean
}

export interface IProjectView {
  id: number,
  imageURL: string;
  viewHeading: string;
  viewDescription: string;
}
