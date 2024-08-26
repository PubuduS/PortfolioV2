import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IExperience } from '@portfolio-v2/interfaces';
import { GetDateTimeService } from '@portfolio-v2/services';

/**
 * Experience page
 */
@Component({
  selector: 'portfolio-v2-experience',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './experience.component.html',
  styleUrl: './experience.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ExperienceComponent {

  /** Selected experience section */
  public selected: string = null ?? 'election';

  /** Date time service */
  private dateTimeService = inject(GetDateTimeService);

  /** Experience List */
  public readonly experienceList: IExperience[] = [
    {
      position: 'Software Engineer at Election Systems and Software',
      timePeriod: '2023 - Present',
      shortDescription: 'I joined Election Systems and Software in September 2023 and feel fortunate to be part of an outstanding team of experts in various\
       domains of software engineering. It has been a great learning experience for me to integrate my knowledge of back-end embedded programming with the new front-end \
       technologies I\'ve acquired since joining Election Systems. Currently, I am working with a team of 10 engineers on updating a legacy product line.',
      points: [
        'Utilized the latest Angular version 16.2, incorporating features like RxJs, Nx, NgRx, and Typescript for a comprehensive UI overhaul.',
        'Implemented a Jenkins Pipeline and integrated CompoDoc for automatic documentation.',
        'Updated bash and Yocto recipes to seamlessly build and link the new UI, along with generating documentation for these changes.',
        'Created technical documentation with confluence.',
        'Provided technical and site support for the 2023 General Election in New Jersey.',
        'Utilized Git and Jenkins for version control and CICD Pipeline; C#, C++, Typescript, .NET, Angular, NgRx, RxJs, Yocto, and Visual \
         Studio and Nx Workspace for a variety of projects; Doxygen, CompoDoc, and JIRA to generate documentation and management of the software development life cycle.'
      ],
      startDate: new Date("2023-09-05"),
      endDate: new Date()
    },

    {
      position: 'Graduate Research Assistant at University of Nebraska Omaha',
      timePeriod: '2021 - 2023',
      shortDescription: 'Designed and developed a HoloLens 2 Mixed Reality application that provides gait training for patients with gait disorders.',
      points: [
        'The application analyzes the environment around the user and spawns an avatar that can intelligently navigate around the environment. \
        When the user follows the avatar, the system analyzes the user\'s walking pattern and assigns a score. Based on the score, it can early \
        identify neural and motor-related disorders and also can help the user with gait training.',

        'This project is a massive collaborative project with multiple departments including medical science, biomechanics, and computer science \
        with over millions of funding (Award Number: P20GM109090)',

        'Translated and optimized algorithms written in Matlab to C# and evaluate the accuracy.',

        'Created a dev journal and extensive technical documentation for future open-source development.',

        'Awarded $5000 Graduate Research and Creative Activity(GRACA) fellowship of the University of Nebraska at Omaha for Summer 2022.',

        'Utilized Git, Github Actions, and Jenkins with AWS S3 Bucket for version control and CICD Pipeline; C#, Unity, MRTK, and Visual Studio \
        to create MR application for HoloLens 2; Doxygen and JIRA to generate documentation and management of the software development life cycle.',
      ],
      startDate: new Date("2021-08-01"),
      endDate: new Date("2023-08-01")
    },

    {
      position: 'Software Engineer (C++) Sencore.Inc',
      timePeriod: '2019 - 2021',
      shortDescription: 'Contributed to the development and optimization of Sencore MRD5800 and MRD7000 advanced modular decoder product lines, as well as associated sub-brands.',
      points: [
        'Engineered and implemented a centralized authentication system using TACACS+ and PAM modules for MRD5800 unit and sub brands; \
        enabling units to connect to centralized remote authentication server to grant access and perform AAA functionalities.',

        'Programmed a portable Java Auditor software to parse through frequencies and log matrices into a CSV file for each channel.',

        'Evaluated a legacy codebase to identify inefficiencies and integrate enhancements.',

        'Utilized a wide variety of technologies throughout operations, including C++, JIRA, Visual Studio Code, Git, Gerrit, PAM, TACACS+, \
        SCons build system, Subversion, JS, ARM AT91 Micro-controllers, Debian GNU/Linux, TeamCity, MIBs, Java SE 8, Netbeans and cURL, \
        Cross-Compilation, Bash, and Doxygen;',

        'Utilized Git, Subversion, and Gerrit for version control and code review; Python, Scons, Bash, and Teamcity to \
        cross-compilation and build system; MIBs to allow remote configurations of the settings; JAVA SE 8, Netbeans and cURL to \
        create auditor software; Doxygen to generate documentation of the software.'
      ],
      startDate: new Date("2019-09-01"),
      endDate: new Date("2021-02-01")
    },

    {
      position: 'Part-Time Web Developer at Peace Lutheran Early Childhood Center.',
      timePeriod: '2018 - 2019',
      shortDescription: 'This is my senior capstone project for final year in South Dakota State University.',
      points: [
        'Assisted the Center with updating and maintaining their web software to effectively track the attendance of over 200 students and staff members.',
        'Learned Agile development, reverse engineering, database normalization, OOP designing, and PHP in order to effectively complete tasks.',
        'Created technical documents to monitor progress.'
      ],
      startDate: new Date("2018-01-01"),
      endDate: new Date("2019-08-01")
    },

    {
      position: 'Student Worker (Part-Time) at Larson Commons',
      timePeriod: '2018 - 2019',
      shortDescription: 'Help with day to day operations of the student cafeteria',
      points: [
        'Liaised with colleagues to provide service in a timely manner to boost the efficiency of dining hall operations.',
        'Provided exceptional service to students and staff frequenting the dining hall.',
        'Maintained consistent communications with colleagues and senior management to exchange updates on operations.',
        'Learned to balance work duties with academic responsibilities.'
      ],
      startDate: new Date("2018-01-01"),
      endDate: new Date("2019-03-01")
    },

    {
      position: 'Software Engineer (JAVA) Java Institute',
      timePeriod: '2014 - 2015',
      shortDescription: 'Engineered an inventory control software for Sapna, a small business in Sri Lanka, to streamline inventory management processes.',
      points: [
        'Identified and addressed common issues of low-level inventory control software, troubleshooting to resolve these issues and achieve full functionality.',
        'Enhanced my working knowledge of SQL and Java tools, as well as OOP concepts, through completion of project tasks.'
      ],
      startDate: new Date("2014-01-01"),
      endDate: new Date("2015-03-01")
    }
  ];

  /** Experience */
  public experience: IExperience = null ?? this.experienceList[0];

  /** Number of years of experience */
  public yearsOfExperience = '1 Year';

  /** Experience data map */
  private readonly experienceDataMap: {[key: string]: IExperience} = {
    election: this.experienceList[0],
    uno: this.experienceList[1],
    sencore: this.experienceList[2],
    peace: this.experienceList[3],
    larson: this.experienceList[4],
    java: this.experienceList[5]
  }

  /** Display selected */
  public displaySelected(selection: string): void {
    if(selection) {
      this.selected = selection;
    }
    this.experience = this.experienceDataMap[this.selected];

    const result = this.dateTimeService.getYearsOfExperience(this.experience.startDate, this.experience.endDate);

    if( result > 1.0) {
      this.yearsOfExperience = `${result.toString()} Years`;
    }
    else {
      this.yearsOfExperience = `${result.toString()} Year`;
    }
  }
}
