import {
  ChangeDetectionStrategy,
  Component,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';

import { GetDataService } from '@portfolio-v2/shared/services';
import { IEducation } from '@portfolio-v2/interfaces';

/**
 * Education Page
 */
@Component({
  selector: 'portfolio-v2-education',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './education.component.html',
  styleUrl: './education.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EducationComponent {
  /** Education information */
  protected readonly educationInfor: Observable<IEducation[]>;

  /**
   * constructor
   * @param dataService data service
   */
  constructor(private dataService: GetDataService) {
    this.educationInfor = this.dataService.getEducationInformation('education-section');
  }
}
