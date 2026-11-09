import {
  IAboutMe,
  IExperience,
  IPublication,
  ISkills,
  ISocialInfo,
} from '@portfolio-v2/state/dataModels';
import { StoreState } from '../state.state';
import { aboutMeSelector } from './about-me.selector';
import { experienceSelector } from './experience.selector';
import { isAdminModeSelector } from './is-admin-mode.selector';
import { isPartyModeSelector } from './is-party-mode.selector';
import { isPreviewModeSelector } from './is-preview-mode.selector';
import { publicationCardsSelector } from './publications.selector';
import { selectedCardIDSelector } from './selected-card-id.selector';
import { selectedPublicationIDSelector } from './selected-publication-id.selector';
import { skillsSelector } from './skills.selector';
import { socialMediaSelector } from './social-media.selector';

/** A store with the flags set and no collections loaded. */
const state: StoreState = {
  selectedProjectCardID: 4,
  selectedPublicationID: 9,
  isAdmin: true,
  isPreviewMode: true,
  isPartyMode: false,
};

/** About-me copy stored for the public page. */
const aboutMe: IAboutMe = {
  id: 1,
  imageSrc: 'photo.webp',
  intro: ['Hello'],
  subHeadingIntro: 'Hi',
  leftPoints: ['One'],
  rightPoints: ['Two'],
};

/** Skills copy stored for the public page. */
const skills: ISkills = {
  id: 1,
  intro: 'Languages',
  languagesCol1: { TypeScript: 3 },
  languagesCol2: { Python: 2 },
  toolHeading: 'Tools',
  leftSubHeading: 'Frameworks',
  framework: ['Angular'],
  rightSubHeading: 'Software',
  software: ['Git'],
};

/** One stored job. */
const job: IExperience = {
  id: 1,
  position: 'Engineer',
  employer: 'Acme',
  timePeriod: '2020 - 2022',
  shortDescription: 'Built software',
  points: ['Shipped'],
  startDate: '2020-01-01',
  endDate: '2022-01-01',
};

/** One stored publication card. */
const publication: IPublication = {
  id: 1,
  title: 'Paper',
  subTitle: 'Keywords',
  imageUrl: 'cover.webp',
  shortDesc: 'Summary',
  btnMoreDisable: false,
  btnDownloadDisable: true,
  downloadFileName: '',
};

/** One stored social link. */
const social: ISocialInfo = {
  id: 1,
  media: 'https://example.com',
  mediaIcon: 'link',
};

describe('slice selectors', () => {
  it('should return the about-me record', () => {
    expect(aboutMeSelector.projector({ ...state, aboutMe })).toBe(aboutMe);
  });

  it('should return the skills record', () => {
    expect(skillsSelector.projector({ ...state, skills })).toBe(skills);
  });

  it('should return the experience records', () => {
    const experiences = [job];

    expect(experienceSelector.projector({ ...state, experiences })).toBe(experiences);
  });

  it('should return the publication cards', () => {
    const publications = [publication];

    expect(publicationCardsSelector.projector({ ...state, publications })).toBe(publications);
  });

  it('should return the social links', () => {
    const socialInfor = [social];

    expect(socialMediaSelector.projector({ ...state, socialInfor })).toBe(socialInfor);
  });

  it('should return the admin, preview, and party flags', () => {
    expect(isAdminModeSelector.projector(state)).toBe(true);
    expect(isPreviewModeSelector.projector(state)).toBe(true);
    expect(isPartyModeSelector.projector({ ...state, isPartyMode: true })).toBe(true);
  });

  it('should return the selected card and publication ids', () => {
    expect(selectedCardIDSelector.projector(state)).toBe(4);
    expect(selectedPublicationIDSelector.projector(state)).toBe(9);
  });
});
