import { IProjectCard } from '../data-models';
import { StoreState } from '../state.state';
import { projectCardSelector } from './project-card.selector';

/**
 * @param id card id
 * @param heading heading that identifies which slice the card came from
 * @returns a project card
 */
function projectCard(id: number, heading: string): IProjectCard {
  return {
    id,
    heading,
    description: '',
    tools: '',
    imageURL: '',
  };
}

/**
 * @param partial slices under test
 * @returns a root state with the portfolio feature key
 */
function bank(partial: Partial<StoreState>): { stateBanks: StoreState } {
  return {
    stateBanks: {
      selectedProjectCardID: 0,
      selectedPublicationID: 0,
      isAdmin: false,
      isPreviewMode: false,
      isPartyMode: false,
      ...partial,
    },
  };
}

describe('projectCardSelector', () => {
  const projects = [projectCard(1, 'One'), projectCard(2, 'Project')];

  it('should return the project card with that id', () => {
    expect(projectCardSelector(2)(bank({ projectCards: projects }))).toEqual(projects[1]);
  });

  it('should read project cards rather than a featured card with the same id', () => {
    expect(projectCardSelector(2)(bank({
      projectCards: projects,
      featuredProjectCards: [projectCard(2, 'Featured')],
    }))).toEqual(projectCard(2, 'Project'));
  });

  it('should return undefined when the id is missing', () => {
    expect(projectCardSelector(9)(bank({ projectCards: projects }))).toBeUndefined();
  });

  it('should return undefined before project cards have loaded', () => {
    expect(projectCardSelector(1)(bank({}))).toBeUndefined();
  });
});
