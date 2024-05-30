import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ICertificateCard } from '@portfolio-v2/interfaces';

@Component({
  selector: 'portfolio-v2-certifications',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './certifications.component.html',
  styleUrl: './certifications.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CertificationsComponent {
  public readonly certificate_icon_URL: string = 'assets/images/certificate_Icon/certificate.png';
  public readonly tooltip: string = 'Click here to view the certificate';

  public readonly certificatesLeft: ICertificateCard[] = [
    {
      title: 'Angular Level 1 Certification',
      completedDate: new Date(2024, 1, 21).toLocaleDateString(),
      organization: 'Angular Training',
      credentialID: '5A20CF0',
      certification: 'Here',
      certificateURL: 'https://interstate21.com/certificate/?code=5A20CF0',
      description: 'This is a professional certification from by Angular Training',
    },
    {
      title: 'AWS Certified Cloud Practitioner',
      completedDate: 'In progress',
      organization: 'Udemy',
      credentialID: 'None',
      certification: 'In Progress',
      description: 'This is a introductory level course about AWS.',
    },
    {
      title: 'Object Oriented Programming in Java',
      completedDate: new Date(2020, 1, 9).toLocaleDateString(),
      organization: 'Coursera',
      credentialID: '64EPBBAFEWYL',
      certification: 'Here',
      certificateURL: 'https://www.coursera.org/account/accomplishments/certificate/64EPBBAFEWYL',
      description: 'This is a online Coursera course offered by University of California San Diego.',
    },
    {
      title: 'Web Development Bootcamp',
      completedDate: 'In progress',
      organization: 'Udemy',
      credentialID: 'None',
      certification: 'In Progress',
      description: 'This is a introductory level course about web development.',
    }
  ]

  public readonly certificatesRight: ICertificateCard[] = [

    {
      title: 'Modern C++ Multi-threading',
      completedDate: new Date(2023, 3, 26).toLocaleDateString(),
      organization: 'Udemy',
      credentialID: 'e2be974d7844',
      certification: 'Here',
      certificateURL: 'https://www.udemy.com/certificate/UC-ecab9d2a-2f1c-4eab-856c-e2be974d7844/',
      description: 'This is an course on modern C++ multi-threading.',
    },
    {
      title: 'Game Development with Unity',
      completedDate: 'In progress',
      organization: 'Udemy',
      credentialID: 'None',
      certification: 'In Progress',
      description: 'This is a course about 2D game development with C#.',
    },
    {
      title: 'Neural Network and Deep Learning',
      completedDate: new Date(2019, 7, 9).toLocaleDateString(),
      organization: 'Coursera',
      credentialID: 'R7P6PNDABS9V',
      certification: 'Here',
      certificateURL: 'https://www.coursera.org/account/accomplishments/certificate/R7P6PNDABS9V',
      description: 'This is a introductory level course about deep learning.',
    }
  ]
}
