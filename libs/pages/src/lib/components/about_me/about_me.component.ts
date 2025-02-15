import {
  ChangeDetectionStrategy,
  Component,
} from '@angular/core';
import { CommonModule } from '@angular/common';

import { IAboutMe } from '@portfolio-v2/interfaces';

/**
 * About me page
 */
@Component({
  selector: 'portfolio-v2-about-me',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './about_me.component.html',
  styleUrl: './about_me.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AboutMeComponent {
  /** About me data */
  public readonly aboutMe: IAboutMe = {
    heading: 'ABOUT ME',
    imageSrc: 'assets/images/aboutme/about.jpg',
    intro: [
      'My name is Pubudu. Currently, I live in Omaha, Nebraska. I enjoy building software, games, and websites. My interest in software engineering started back in 2012 when I decided to attend a code camp. After that, I decided to pursue my higher education in the US.',
      'Fast forward to today, I\'ve had the privilege of working at A corporation, a charitable organization, and a small business. I graduated from the University of Omaha at Nebraska with a MSc in Computer Science in May 2023. These days I am actively looking forward jobs that align with my skills.',
      'I am currently open to new opportunities where I can learn new technologies and helped to develop robust software. Need something built or simply want to have chat? Reach out to me on social media or send me an email.',
    ],
    subHeading: 'My Personal Interests',
    subHeadingIntro: 'When I\'m not coding my next project, I enjoy spending my time doing any on the following:',
    leftPoints: [
      'I love Cooking. I love to create Asian American fusion dishes.',
      'I\'m a bookworm and fan of Philosophy, Science Fiction, Fictional, and Mystery genre.',
    ],
    rightPoints: [
      'I\'m eager to learn new technologies and new skills.',
      'I enjoy playing Chess.',
    ],
    link: 'https://www.youtube.com/watch?v=wX4gqdt23Ow',
  };
}
