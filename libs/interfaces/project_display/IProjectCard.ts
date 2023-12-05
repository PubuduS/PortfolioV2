export interface IProjectCard
{
    heading: string;
    description: string;
    tools: string;
    imageURL: string;
    githubURL?: string,
    demoURL?: string,
    documentationURL?: string,
    screenshotURL?: string    
}

export interface IProjectView {
    imageURL: string;
    viewHeading: string;
    viewDescription: string;
}
