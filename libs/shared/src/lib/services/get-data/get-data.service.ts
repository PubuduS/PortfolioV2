import * as _ from 'lodash';
import { Injectable } from '@angular/core';
import {
  map,
  Observable,
  of,
} from 'rxjs';
import {
  Firestore,
  collection,
  collectionData,
  doc,
  docData,
  orderBy,
  query,
} from '@angular/fire/firestore';
import { Storage } from '@angular/fire/storage';

import {
  IAboutMe,
  IEducation,
  IExperience,
  IProjectCard,
  IProjectView,
  IPublicationDetails,
  ISkills,
  ISocialInfor,
} from '@portfolio-v2/interfaces';

/**
 * Get Data Searvice
 * TODO: These will soon move to database
 */
@Injectable({
  providedIn: 'root',
})
export class GetDataService {
  /** Selected record */
  private selectedRecord = '';

  /** Holds project card for now. todo: move this to ngrx state */
  public projectCard: Observable<IProjectCard | undefined> = of(undefined);

  /** Social information */
  private readonly socialInfor: ISocialInfor = {
    linkedin: 'https://www.linkedin.com/in/pubudu-wijesooriya/',
    github: 'https://github.com/PubuduS/',
    email: 'pubudusupun@gmail.com',
  };

  /** Publication details */
  private readonly publicationDetails: IPublicationDetails[] = [
    {
      title: 'ARWalker: A Virtual Walking Companion Application',
      authors: 'Pubudu Wijesooriya, Aaron Likens, Nick Stergiou, and Spyridon Mastorakis',
      abstarct: 'Extended Reality (XR) technologies, including Augmented Reality (AR), have attracted significant attention over the past few years and have been utilized in several fields, including education, healthcare, and manufacturing. In this paper, we aim to explore the use of AR in the field of biomechanics and human movement through the development of ARWalker, which is an AR application that features virtual walking companions (avatars). Research participants walk in close synchrony with the virtual companions, whose gait exhibits properties found in the gait of young and healthy adults. As a result, research participants can train their gait to the gait of the avatar, thus regaining the healthy properties of their gait and reducing the risk of falls. ARWalker can especially help older adults and individuals with diseases, who exhibit pathological gait thus being more prone to falls. We implement a prototype of ARWalker and evaluate its systems performance while running on a Microsoft Hololens 2 headset.',
      citation: 'Pubudu Wijesooriya, Likens, A. D., Stergiou, N., & Spyridon Mastorakis. (2023). ARWalker: A Virtual Walking Companion Application. ArXiv (Cornell University). https://doi.org/10.48550/arxiv.2311.07502',
    },
    {
      title: 'Investigating the Characteristics and Performance of Augmented Reality Applications on Head-Mounted Displays: A Study of the Hololens Application Store',
      authors: 'Pubudu Wijesooriya, Sheikh Muhammad Farjad, Nick Stergiou, and Spyridon Mastorakis',
      abstarct: 'Augmented Reality (AR) based on Head-Mounted Displays (HMDs) has gained significant traction over the recent years. Nevertheless, it remains unclear what AR HMD-based applications have been developed over the years and what their system performance is when they are run on HMDs. In this paper, we aim to shed light into this direction. Our study focuses on the applications available on the Microsoft Hololens application store given the wide use of the Hololens headset. Our study has two major parts: (i) we collect metadata about the applications available on the Microsoft Hololens application store to understand their characteristics (e.g., categories, pricing, permissions requested, hardware and software compatibility); and (ii) we interact with these applications while running on a Hololens 2 headset and collect data about systems-related metrics (e.g., memory and storage usage, time spent on CPU and GPU related operations) to investigate the systems performance of applications. Our study has resulted in several interesting findings, which we share with the research community.',
      citation: 'Pubudu Wijesooriya, Sheikh Muhammad Farjad, Stergiou, N., & Spyridon Mastorakis. (2023). Investigating the Characteristics and Performance of Augmented Reality Applications on Head-Mounted Displays: A Study of the Hololens Application  Store. ArXiv (Cornell University). https://doi.org/10.48550/arxiv.2303.07523',
    },
    {
      title: 'Use of Mixed Reality to Provide Gait Rehabilitation',
      authors: 'Pubudu Wijesooriya, Advisor: Dr. Spyridon Mastorakis',
      // eslint-disable-next-line no-multi-str
      abstarct: 'Gait disorders are a common issue affecting millions of people worldwide regardless\
      of age. In addition to reducing mobility, gait disorders increase the risk of falling, and\
      can adversely affect the quality of life. Therefore, gait training is an essential aspect\
      of well-being, especially for the elderly population. To address this problem, many\
      systems have been developed. In this study, we present a novel method to provide gait\
      training. We present two portable mixed reality systems designed to aid gait training\
      for individuals with gait disabilities.\
      The first system uses an avatar to provide visual cues to the patient. It relies on the\
      proteus effect and complexity matching to restore the natural gait. The proteus effect\
      refers to the phenomenon where individuals adopt the characteristics of their virtual\
      avatars. Complexity matching is the tendency to synchronize movements by matching\
      others\' complexity. Both theories are backed by credible scientific evidence. Our pilot\
      study showed that this approach is effective in restoring gait patterns. The system is\
      currently undergoing large-scale human trials to evaluate its feasibility further.\
      A second system provides rhythmic visual cues through a moving bar, and the user\
      must match their foot placement accordingly. As the rhythm changes, users are required\
      to strike with their left heel when the bar reaches the top level and with their right heel\
      when it hits the bottom level. Pilot studies supported by similar research have also\
      shown promising results, and we are currently conducting large-scale human trials to\
      evaluate the system\'s effectiveness further.\
      Both systems are designed to help patients with gait disabilities and provide implicit\
      learning. We aim to provide them with cost-effective, self-training methods to\
      restore their gait. The results of this study could have significant implications for the\
      rehabilitation of individuals with gait disabilities.',
      citation: 'Wijesooriya, P. (2023, May 3). Use of Mixed Reality to Provide Gait Rehabilitation.',
    },
  ];

  /** Publication data map */
  private readonly publicationDataMap: { [key: string]: IPublicationDetails } = {
    ARWalker: this.publicationDetails[0],
    HLStore: this.publicationDetails[1],
    Thesis: this.publicationDetails[2],
  };

  /**
   * constructor
   * @param storage angular fire storage
   * @param firestore firestore
   */
  constructor(
    private storage: Storage,
    private firestore: Firestore,
  ) {}

  /**
   * Get about me section data
   * @param location collection name
   * @returns Observable of IAboutMe
   */
  public getAboutMeSectionData(location: string): Observable<IAboutMe> {
    const cardCollection = collection(this.firestore, location);
    const orderedQuery = query(cardCollection, orderBy('id'));
    const aboutMeData = (collectionData(orderedQuery) as Observable<IAboutMe[]>).pipe(
      map((data) => data[0]),
      map((data) => ({
        ...data,
        intro: this.lineBreaker(typeof data.intro === 'string' ? data.intro : data.intro.join('')),
        leftPoints: this.lineBreaker(typeof data.leftPoints === 'string' ? data.leftPoints : data.leftPoints.join('')),
        rightPoints: this.lineBreaker(typeof data.rightPoints === 'string' ? data.rightPoints : data.rightPoints.join('')),
      })),
    );

    return aboutMeData;
  }

  /**
   * Get skills section data
   * @param location collection name
   * @returns Observable of IAboutMe
   */
  public getSkillsSectionData(location: string): Observable<ISkills> {
    const cardCollection = collection(this.firestore, location);
    const orderedQuery = query(cardCollection, orderBy('id'));
    const skillsData = (collectionData(orderedQuery) as Observable<ISkills[]>).pipe(
      map((data) => data[0]),
      map((data) => (
        {
          ...data,
          languagesCol1: this.createSkillMap(data.languagesCol1 as unknown as string),
          languagesCol2: this.createSkillMap(data.languagesCol2 as unknown as string),
          framework: this.lineBreaker(typeof data.framework === 'string' ? data.framework : data.framework.join('')),
          software: this.lineBreaker(typeof data.software === 'string' ? data.software : data.software.join('')),
        })),
    );

    return skillsData;
  }

  /**
   * Get experience section data
   * @param location collection name
   * @returns Observable of IAboutMe
   */
  public getExperienceSectionData(location: string): Observable<IExperience[]> {
    const cardCollection = collection(this.firestore, location);
    const orderedQuery = query(cardCollection, orderBy('id', 'desc'));
    const experienceData = (collectionData(orderedQuery) as Observable<IExperience[]>).pipe(
      map((data) => _.map(data, (exp: IExperience) => ({
        ...exp,
        startDate: new Date(exp.startDate),
        endDate: exp.endDate as unknown as string === 'present' ? new Date() : new Date(exp.endDate),
      }))),
    );
    return experienceData;
  }

  /**
   * Get project section icons and descriptions
   * @param location collection name
   * @returns Observable of IAboutMe
   */
  public getProjectView(location: string): Observable<IProjectView[]> {
    const cardCollection = collection(this.firestore, location);
    const orderedQuery = query(cardCollection, orderBy('id'));
    return (collectionData(orderedQuery) as Observable<IProjectView[]>);
  }

  /**
   * Get a specific project card by id
   * @param location location
   * @param id id
   * @returns observable of project card or undefined if no records were found.
   */
  public getProjectCardById(location: string, id: number): Observable<IProjectCard | undefined> {
    const recordId = `project-${id.toString().padStart(2, '0')}`;
    const documentRef = doc(this.firestore, `${location}/${recordId}`);
    const data = docData(documentRef) as Observable<IProjectCard | undefined>;
    this.projectCard = data;
    return data;
  }

  /**
   * Get education information
   * @param location location
   * @returns observable of IEducation array.
   */
  public getEducationInformation(location: string): Observable<IEducation[]> {
    const cardCollection = collection(this.firestore, location);
    const orderedQuery = query(cardCollection, orderBy('id', 'desc'));
    return (collectionData(orderedQuery) as Observable<IEducation[]>);
  }

  /**
   * Setter for record selection
   * @param selected selected record
   */
  public setSelectedRecord(selected: string): void {
    this.selectedRecord = selected;
  }

  /**
   * Getter for record selection
   * @returns seelcted record
   */
  public getSelectedRecord(): string {
    return this.selectedRecord;
  }

  /**
   * Getter for publications data
   * @param record data
   * @returns publication details data model
   */
  public getPublicationDetail(record: string): IPublicationDetails {
    return this.publicationDataMap[record];
  }

  /**
   * Getter for social media information
   * @returns social media information data model
   */
  public getSocialInfor(): ISocialInfor {
    return this.socialInfor;
  }

  /**
   * Get the whole string and break it based on the delimiter
   * @param content Content as a single string
   * @returns Array of strings(Paragraphs)
   */
  private lineBreaker(content: string): string[] {
    return content
    // Split the string at each delimiter
      .split('<<LEnd>>')
    // Trim whitespace from each paragraph
      .map((paragraph) => paragraph.trim())
    // Remove empty entries
      .filter((paragraph) => paragraph.length > 0);
  }

  /**
   * Get the string marked with delimiter and clean up the string.
   * Then create a map of Map<string, number>.
   * @param content Content as a single string
   * @returns Map of skill and progress bar value
   */
  private createSkillMap(content: string): Map<string, number> {
    const breakLines = this.lineBreaker(content).join('').split('$');
    const skillMap = new Map<string, number>();

    for (let i = 0; i < breakLines.length; i += 2) {
      skillMap.set(breakLines[i], Number(breakLines[i + 1]));
    }

    return skillMap;
  }
}
