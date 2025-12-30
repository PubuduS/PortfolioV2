import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
} from '@angular/core';

import { FlowerAnimationComponent } from './components/flower/flower-animation.component';

/** function declaration for flower animation */
declare function FlowerAnimation(): void;

/** Education main page */
@Component({
  selector: 'portfolio-v2-education-main',
  standalone: true,
  imports: [
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
