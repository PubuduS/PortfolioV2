import { Injectable } from '@angular/core';
import { IProjectCard } from '../../interfaces';

@Injectable({
  providedIn: 'root'
})
export class GetdataService {

  constructor() { }

  private selectedRecord: string = '';

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

  private portfolioDataMap: {[key: string]: IProjectCard} = {
    auditor: this.portfolioData[0],
    gameboy: this.portfolioData[1],
    sorting: this.portfolioData[2],
    portfoliov1: this.portfolioData[3],
    detective: this.portfolioData[4],
    inventory: this.portfolioData[5],
    etlExporter: this.portfolioData[6],
  }

  public getPortfolioData(record: string): IProjectCard {
    return this.portfolioDataMap[record];
  }

  public setSelectedRecord(selected: string): void {
    this.selectedRecord = selected;
  }

  public getSelectedRecord(): string {
    return this.selectedRecord;
  }
}
