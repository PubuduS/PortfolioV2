import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IProjectCard } from 'libs/interfaces/project_display/IProjectCard';
import { IconURLs, IconURLType } from 'libs/const/icons';

@Component({
  selector: 'portfolio-v2-featured-projects',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './featured_projects.component.html',
  styleUrl: './featured_projects.component.css',
})
export class FeaturedProjectsComponent {

  readonly icons: IconURLType = IconURLs;

  readonly gaitTrainer: IProjectCard = {
    heading: 'Gait Trainer',
    description: 'A mixed reality, cross-platform application that provides gait training to patients.',
    tools: 'C#, Unity, Visual Studio, Doxygen, GitHub, GitHub Actions, Jenkins, AWS S3, GitHub pages, OpenXR, MRTK',
    imageURL: 'assets/images/featured_projects/project1.jpg',
    githubURL: 'https://github.com/PubuduS/Gait_Training/tree/dev_followme',
    demoURL: 'https://youtu.be/t9CPMqp_rRg',
    documentationURL: 'https://pubudus.github.io/Gait_Training/',
    screenshotURL: 'assets/images/project_screenshots/mr_app_ss.png'
  };

  readonly farmingGame: IProjectCard = {
    heading: '2D Farming Game',
    description: 'A simple pixel farming game similar to Stardew Valley.',
    tools: 'C#, Unity, Visual Studio, Doxygen, GitHub, GitHub Actions, GitHub pages',
    imageURL: 'assets/images/featured_projects/project2.jpg',
    githubURL: 'https://github.com/PubuduS/Farming_RPG',
    demoURL: 'https://youtu.be/IkFDgCI8DBM',
    documentationURL: 'https://pubudus.github.io/Farming_RPG/',
    screenshotURL: 'assets/images/project_screenshots/farming_rpg_ss.png'
  };

  readonly centralServer: IProjectCard = {
    heading: 'A centralized server authentication login',
    description: 'This feature provides centralized server-based authentication and login functionality for the Sencore MRD5800 product line and its sub-brands.',
    tools: 'C++, Tacacs, HTML, CSS, Python, Scons, Bash, Git, Gerrit, Subversion, Teamcity, Jira',
    imageURL: 'assets/images/featured_projects/project3.jpg',
    demoURL: 'https://youtu.be/sx0_Yjl_cSQ',
    screenshotURL: 'assets/images/project_screenshots/tacacs_ss.png'
  };
  

}
