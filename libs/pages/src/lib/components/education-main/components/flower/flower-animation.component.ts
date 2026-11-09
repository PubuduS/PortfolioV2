import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Input,
  viewChild,
} from '@angular/core';
import { Router } from '@angular/router';

import { EDUCATION_FLOWER_MARKUP } from './education-flower';

/** Animated link into one education section. */
@Component({
  selector: 'portfolio-v2-flower-animation',
  standalone: true,
  templateUrl: './flower-animation.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './flower-animation.component.scss',
})
export class FlowerAnimationComponent implements AfterViewInit {
  /** Path to the icon in assets. Must be 128px x 128px. */
  @Input({ required: true }) public iconLink!: string;
  /** Title to display under the icon */
  @Input({ required: true }) public title!: string;
  /** Title to display under the icon */
  @Input({ required: true }) public routerPath!: string;

  /** Live drawing. The timeline addresses nodes inside this element. */
  private readonly frame = viewChild.required<ElementRef<SVGSVGElement>>('frame');

  /**
   * constructor
   * @param router router
   */
  constructor(private router: Router) {}

  /**
   * Put the drawing in the page before the timeline starts.
   */
  public ngAfterViewInit(): void {
    const svg = this.frame().nativeElement;
    if (svg.querySelector('style')) {
      return;
    }
    const parsed = new DOMParser().parseFromString(
      `<svg xmlns="http://www.w3.org/2000/svg">${EDUCATION_FLOWER_MARKUP}</svg>`,
      'image/svg+xml',
    );
    Array.from(parsed.documentElement.childNodes).forEach((node) => {
      svg.appendChild(document.importNode(node, true));
    });
  }

  /**
   * Navigate to the given route
   */
  protected goToPage(): void {
    this.router.navigate([this.routerPath]);
  }
}
