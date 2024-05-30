import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

/** function declaration for flower animation */
declare function FlowerAnimation(): void;

/** Education main page */
@Component({
  selector: 'portfolio-v2-education-main',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './education_main.component.html',
  styleUrl: './education_main.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EducationMainComponent implements OnInit {
  /**
   * @inheritdoc
   */
  ngOnInit(): void {
    FlowerAnimation();
  }
}
