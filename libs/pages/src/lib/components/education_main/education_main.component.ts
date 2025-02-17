import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';

import { FlowerAnimationComponent } from './components/flower/flower-animation.component';

/** function declaration for flower animation */
declare function FlowerAnimation(): void;

/** Education main page */
@Component({
  selector: 'portfolio-v2-education-main',
  standalone: true,
  imports: [
    CommonModule,
    FlowerAnimationComponent,
  ],
  templateUrl: './education_main.component.html',
  styleUrl: './education_main.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EducationMainComponent implements OnInit {
  /**
   * @inheritdoc
   */
  public ngOnInit(): void {
    FlowerAnimation();
  }
}
