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
} from '@portfolio-v2/state/dataModels';

/** Allowed Data Types for Database Operations */
export type AllowedRecords = IAboutMe | ISkills | IExperience | IProjectView | IProjectCard
| IPublication | IPublicationDetails | ICertificateCard | IEducation | ISocialInfor;
