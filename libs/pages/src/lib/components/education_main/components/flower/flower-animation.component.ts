import {
  Component,
  Input,
  ChangeDetectionStrategy
} from '@angular/core';
import { Router } from '@angular/router';

/** Animated link into one education section. */
@Component({
  selector: 'portfolio-v2-flower-animation',
  standalone: true,
  templateUrl: './flower-animation.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './flower-animation.component.scss',
})
export class FlowerAnimationComponent {
  /** Link to the icon. Must be 128px x 128px */
  @Input({ required: true }) public iconLink!: string;
  /** Title to display under the icon */
  @Input({ required: true }) public title!: string;
  /** Title to display under the icon */
  @Input({ required: true }) public routerPath!: string;

  /**
   * constructor
   * @param router router
   */
  constructor(private router: Router) {}

  /**
   * Navigate to the given route
   */
  protected goToPage(): void {
    this.router.navigate([this.routerPath]);
  }
}
