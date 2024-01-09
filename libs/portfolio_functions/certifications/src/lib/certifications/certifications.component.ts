import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ICertificateCard } from '@portfolio-v2/interfaces/certificate';

@Component({
  selector: 'portfolio-v2-certifications',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './certifications.component.html',
  styleUrl: './certifications.component.css',
})
export class CertificationsComponent {
  public readonly certificate_icon_URL: string = 'assets/images/certificate_Icon/certificate.png';
  public readonly tooltip: string = 'Click here to view the certificate';

  public readonly cloudPractitioner: ICertificateCard = {
    title: 'AWS Certified Cloud Practitioner',
    completedDate: 'In progress',
    organization: 'Udemy',
    credentialID: 'None',
    certification: 'In Progress',
    description: 'This is a introductory level course about AWS.',
  }

  public readonly multiThread: ICertificateCard = {
    title: 'Modern C++ Multi-threading',
    completedDate: new Date(2023, 3, 26).toLocaleDateString(),
    organization: 'Udemy',
    credentialID: 'e2be974d7844',
    certification: 'Here',
    certificateURL: 'https://www.udemy.com/certificate/UC-ecab9d2a-2f1c-4eab-856c-e2be974d7844/',
    description: 'This is an introductory course on modern C++ multi-threading capabilities.',
  }

  public readonly oopJava: ICertificateCard = {
    title: 'Object Oriented Programming in Java',
    completedDate: new Date(2020, 1, 9).toLocaleDateString(),
    organization: 'Coursera',
    credentialID: '64EPBBAFEWYL',
    certification: 'Here',
    certificateURL: 'https://www.coursera.org/account/accomplishments/certificate/64EPBBAFEWYL',
    description: 'This is a online Coursera course offered by University of California San Diego.',
  }

  public readonly deepLearning: ICertificateCard = {
    title: 'Neural Network and Deep Learning',
    completedDate: new Date(2019, 7, 9).toLocaleDateString(),
    organization: 'Coursera',
    credentialID: 'R7P6PNDABS9V',
    certification: 'Here',
    certificateURL: 'https://www.coursera.org/account/accomplishments/certificate/R7P6PNDABS9V',
    description: 'This is a introductory level course about deep learning.',
  }

  public readonly unityGame: ICertificateCard = {
    title: 'Game Development with Unity',
    completedDate: 'In progress',
    organization: 'Udemy',
    credentialID: 'None',
    certification: 'In Progress',
    description: 'This is a introductory level course about 2D game development with C#.',
  }

  public readonly webDev: ICertificateCard = {
    title: 'Web Development Bootcamp',
    completedDate: 'In progress',
    organization: 'Udemy',
    credentialID: 'None',
    certification: 'In Progress',
    description: 'This is a introductory level course about web development.',
  }
}
