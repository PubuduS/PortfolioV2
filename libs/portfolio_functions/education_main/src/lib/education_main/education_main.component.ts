import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
declare function FlowerAnimation(): void;

@Component({
  selector: 'portfolio-v2-education-main',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './education_main.component.html',
  styleUrl: './education_main.component.css',
})
export class EducationMainComponent implements OnInit {
  ngOnInit(): void {
    FlowerAnimation();
  }
}
