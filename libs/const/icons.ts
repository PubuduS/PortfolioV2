/** Icon paths and tooltips for featured-project links. */
export type IconURLType = {
    githubIco: string,
    gitIcoTooltip: string,
    videoIco: string,
    videoIcoTooltip: string,
    documentIco: string,
    documentationIcoTooltip: string,
    screenshotIco: string,
    screenshotIcoTooltip: string,
}

/** Icon paths and tooltips used by featured-project cards. */
export const IconURLs: IconURLType = {
    githubIco: 'assets/images/featured-projects/git.png',
    gitIcoTooltip: 'Go to GitHub repository',
    videoIco: 'assets/images/featured-projects/share.png',
    videoIcoTooltip: 'See a demo video of the project',
    documentIco: 'assets/images/featured-projects/file.png',
    documentationIcoTooltip: 'Access the documentation of the project',
    screenshotIco: 'assets/images/featured-projects/cut.png',
    screenshotIcoTooltip: 'See a screen shot of the project'
};