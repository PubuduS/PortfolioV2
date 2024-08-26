import { Injectable } from '@angular/core';
import { IProjectCard, IPublicationDetails, ISocialInfor } from '@portfolio-v2/interfaces';

/**
 * Get Data Searvice
 * TODO: These will soon move to database
 */
@Injectable({
  providedIn: 'root'
})
export class GetDataService {
  /** Selected record */
  private selectedRecord = '';

  /** Social information */
  private readonly socialInfor: ISocialInfor = {
    linkedin: 'https://www.linkedin.com/in/pubudu-wijesooriya/',
    github: 'https://github.com/PubuduS/',
    email: 'pubudusupun@gmail.com'
  }

  /** Portfolio data map */
  private readonly portfolioData: IProjectCard[] = [
    {
      heading: 'Auditor Tool',
      description: 'The Qam units use a bash script for the tunning process. This is a cumbersome process for windows users since they have to install Cygwin to run the bash script. I developed this platform independence, portable helper tool to ease up this process. This was designed to be user-friendly and it can be used by anyone without worrying about technical details.',
      tools: 'Java, XML, Netbeans, cURL, Bash, Git, Gerrit, Jira',
      imageURL: 'assets/images/some_projects/pro3.jpg',
      githubURL:'https://github.com/PubuduS/QAM-Auditor',
      gitDisable: false,
      demoURL: 'https://youtu.be/dYWTHK3TkKU',
      demoDisable: false,
      documentationURL:'',
      docDisable: true,
      screenshotURL: 'assets/images/project_screenshots/qam-ss.png',
      ssDisable: false
    },
    {
      heading: 'Retro GameBoy',
      description: 'Developed a gameboy system with classic game collections.',
      tools: 'C++, CMake, Git, SFML/Graphics, Jira, Doxygen',
      imageURL: 'assets/images/some_projects/pro4.jpg',
      githubURL:'https://github.com/PubuduS/RetroGameBoy',
      gitDisable: false,
      demoURL: 'https://youtu.be/e3Lzqpv7jEE',
      demoDisable: false,
      documentationURL:'',
      docDisable: true,
      screenshotURL: 'assets/images/project_screenshots/gameboy-ss.PNG',
      ssDisable: false
    },
    {
      heading: 'Sorting Algorithm',
      description: 'Developed a collection of sorting algorithm templates alone with a visualizer to illustrate sorting algorithem behavior.',
      tools: 'C++, CMake, Scons, Git, Jira, Doxygen',
      imageURL: 'assets/images/some_projects/pro5.jpg',
      githubURL:'https://github.com/PubuduS/Sorting',
      gitDisable: false,
      demoURL: 'https://youtu.be/OvTVbfHerwY',
      demoDisable: false,
      documentationURL:'',
      docDisable: true,
      screenshotURL: 'assets/images/project_screenshots/sorting-ss.PNG',
      ssDisable: false
    },
    {
      heading: 'Portfolio Website',
      description: 'Developed a responsive portfolio. Hosted it on AWS with CDN functionality for minimum latency. Link it to GitHub workflow.',
      tools: 'HTML, CSS, Javascript, Git, AWS, CloudFront, Git Workflow',
      imageURL: 'assets/images/some_projects/pro6.jpg',
      githubURL:'https://github.com/PubuduS/Portfolio_V1.0',
      gitDisable: false,
      demoURL: '',
      demoDisable: true,
      documentationURL:'',
      docDisable: true,
      screenshotURL: '',
      ssDisable: true
    },
    {
      heading: 'Detective-Adventure',
      description: 'Developed a 2D RPG game using unity game engine.',
      tools: 'C#, Git, Unity',
      imageURL: 'assets/images/some_projects/pro7.jpg',
      githubURL:'https://github.com/PubuduS/Detective-Adventure-Beta',
      gitDisable: false,
      demoURL: 'https://youtu.be/MhaBu72R1R4',
      demoDisable: false,
      documentationURL:'',
      docDisable: true,
      screenshotURL: 'assets/images/project_screenshots/detective-game.PNG',
      ssDisable: false
    },
    {
      heading: 'Inventory Control System',
      description: 'Developed a small inventory control software for a small business.',
      tools: 'Java, Netbeans,SQLite',
      imageURL: 'assets/images/some_projects/pro8.jpg',
      githubURL:'',
      gitDisable: true,
      demoURL: '',
      demoDisable: true,
      documentationURL: '',
      docDisable: true,
      screenshotURL: 'assets/images/project_screenshots/sapna-ss.PNG',
      ssDisable: false
    },
    {
      heading: 'ETL to CSV Exporter',
      description: 'This helper tool is designed to export windows performance analyzer .etl trace files to CSV format. The user has to enter the .etl file directory and then choose from the 4 profiles (CPU, GPU, Memory, Storage). Then, the system will iteratively export all the data in CSV format.',
      tools: 'Java, Netbeans, Github',
      imageURL: 'assets/images/some_projects/pro9.jpg',
      githubURL:'https://github.com/PubuduS/ETL_TO_CSV_Exporter',
      gitDisable: false,
      demoURL: 'https://youtu.be/tM_0LIAZWM4',
      demoDisable: false,
      documentationURL: '',
      docDisable: true,
      screenshotURL: '',
      ssDisable: true
    },
  ];

  /** Publication details */
  private readonly publicationDetails: IPublicationDetails[] = [
    {
      title: 'ARWalker: A Virtual Walking Companion Application',
      authors: 'Pubudu Wijesooriya, Aaron Likens, Nick Stergiou, and Spyridon Mastorakis',
      abstarct: 'Extended Reality (XR) technologies, including Augmented Reality (AR), have attracted significant attention over the past few years and have been utilized in several fields, including education, healthcare, and manufacturing. In this paper, we aim to explore the use of AR in the field of biomechanics and human movement through the development of ARWalker, which is an AR application that features virtual walking companions (avatars). Research participants walk in close synchrony with the virtual companions, whose gait exhibits properties found in the gait of young and healthy adults. As a result, research participants can train their gait to the gait of the avatar, thus regaining the healthy properties of their gait and reducing the risk of falls. ARWalker can especially help older adults and individuals with diseases, who exhibit pathological gait thus being more prone to falls. We implement a prototype of ARWalker and evaluate its systems performance while running on a Microsoft Hololens 2 headset.',
      citation: 'Pubudu Wijesooriya, Likens, A. D., Stergiou, N., & Spyridon Mastorakis. (2023). ARWalker: A Virtual Walking Companion Application. ArXiv (Cornell University). https://doi.org/10.48550/arxiv.2311.07502'
    },
    {
      title: 'Investigating the Characteristics and Performance of Augmented Reality Applications on Head-Mounted Displays: A Study of the Hololens Application Store',
      authors: 'Pubudu Wijesooriya, Sheikh Muhammad Farjad, Nick Stergiou, and Spyridon Mastorakis',
      abstarct: 'Augmented Reality (AR) based on Head-Mounted Displays (HMDs) has gained significant traction over the recent years. Nevertheless, it remains unclear what AR HMD-based applications have been developed over the years and what their system performance is when they are run on HMDs. In this paper, we aim to shed light into this direction. Our study focuses on the applications available on the Microsoft Hololens application store given the wide use of the Hololens headset. Our study has two major parts: (i) we collect metadata about the applications available on the Microsoft Hololens application store to understand their characteristics (e.g., categories, pricing, permissions requested, hardware and software compatibility); and (ii) we interact with these applications while running on a Hololens 2 headset and collect data about systems-related metrics (e.g., memory and storage usage, time spent on CPU and GPU related operations) to investigate the systems performance of applications. Our study has resulted in several interesting findings, which we share with the research community.',
      citation: 'Pubudu Wijesooriya, Sheikh Muhammad Farjad, Stergiou, N., & Spyridon Mastorakis. (2023). Investigating the Characteristics and Performance of Augmented Reality Applications on Head-Mounted Displays: A Study of the Hololens Application  Store. ArXiv (Cornell University). https://doi.org/10.48550/arxiv.2303.07523'
    },
    {
      title: 'Use of Mixed Reality to Provide Gait Rehabilitation',
      authors: 'Pubudu Wijesooriya, Advisor: Dr. Spyridon Mastorakis',
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
      citation: 'Wijesooriya, P. (2023, May 3). Use of Mixed Reality to Provide Gait Rehabilitation.'
    }
  ];

  /** Portfolio data map */
  private readonly portfolioDataMap: {[key: string]: IProjectCard} = {
    auditor: this.portfolioData[0],
    gameboy: this.portfolioData[1],
    sorting: this.portfolioData[2],
    portfoliov1: this.portfolioData[3],
    detective: this.portfolioData[4],
    inventory: this.portfolioData[5],
    etlExporter: this.portfolioData[6],
  }

  /** Publication data map */
  private readonly publicationDataMap: {[key: string]: IPublicationDetails} = {
    ARWalker: this.publicationDetails[0],
    HLStore: this.publicationDetails[1],
    Thesis: this.publicationDetails[2]
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
   * Getter for portfolio data
   * @param record data
   * @returns project card data model
   */
  public getPortfolioData(record: string): IProjectCard {
    return this.portfolioDataMap[record];
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
}
