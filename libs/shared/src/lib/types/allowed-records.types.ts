import {
  IAboutMe,
  IExperience,
  IProjectCard,
  IProjectView,
  ISkills,
} from '@portfolio-v2/state/dataModels';

/** Allowed Data Types for Database Operations */
export type AllowedRecords = IAboutMe | ISkills | IExperience | IProjectView | IProjectCard;
