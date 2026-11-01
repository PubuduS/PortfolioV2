import {
  IAboutMe,
  ICertificateCard,
  IEducation,
  IExperience,
  IProjectCard,
  IProjectView,
  IPublication,
  IPublicationDetails,
  ISkills,
  ISocialInfor,
} from './data-models';

/** State interface */
export interface StoreState {
  /** About-me copy shown on the public page. */
  aboutMe?: IAboutMe,
  /** Skills copy shown on the public page. */
  skills?: ISkills,
  /** Experience records. */
  experiences?: IExperience[],
  /** Portfolio section cards. */
  portfolioCards?: IProjectView[],
  /** Project cards that are not featured. */
  projectCards?: IProjectCard[],
  /** Featured project cards. */
  featuredProjectCards?: IProjectCard[],
  /** Id of the project card open in the editor. */
  selectedProjectCardID: number,
  /** Certificate records. */
  certificates?: ICertificateCard[],
  /** Degree records. */
  education?: IEducation[],
  /** Publication cards. */
  publications?: IPublication[],
  /** Id of the publication open in the editor. */
  selectedPublicationID: number,
  /** Publication detail documents. */
  publicationDetails?: IPublicationDetails[],
  /** Social links shown in the footer and cover letter. */
  socialInfor?: ISocialInfor[],
  /** Whether an admin is signed in for this session. */
  isAdmin: boolean,
  /** Whether the admin is previewing the public site. */
  isPreviewMode: boolean,
  /** Whether the party-mode animation is on. */
  isPartyMode: boolean,
}
