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
  aboutMe?: IAboutMe,
  skills?: ISkills,
  experiences?: IExperience[],
  portfolioCards?: IProjectView[],
  projectCards?: IProjectCard[],
  selectedProjectCardID: number,
  certificates?: ICertificateCard[],
  education?: IEducation[],
  publications?: IPublication[],
  selectedPublicationID: number,
  publicationDetails?: IPublicationDetails[],
  socialInfor?: ISocialInfor[],
  isAdmin: boolean,
}
