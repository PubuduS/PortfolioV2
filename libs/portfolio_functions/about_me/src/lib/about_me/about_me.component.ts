import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'portfolio-v2-about-me',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './about_me.component.html',
  styleUrl: './about_me.component.css',
})
export class AboutMeComponent {
  myImageSrc: string = "assets/images/aboutme/about.jpg";
}
