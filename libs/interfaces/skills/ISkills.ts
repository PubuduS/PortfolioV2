export interface ISkills {
    id: number,
    heading: string,
    intro: string,
    languagesCol1: Map<string, number>,
    languagesCol2: Map<string, number>,
    toolHeading: string,
    leftSubHeading: string,
    framework: string[],
    rightSubHeading: string,
    software: string[]
}
