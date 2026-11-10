import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  inject,
} from '@angular/core';
import { MatIconRegistry } from '@angular/material/icon';
import { RouterOutlet } from '@angular/router';

import { NavBarComponent } from '@portfolio-v2/shared/components';

/** Main Component */
@Component({
  standalone: true,
  imports: [
    RouterOutlet,
    NavBarComponent,
  ],
  selector: 'portfolio-v2-root',
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './app.component.scss',
})
export class AppComponent {
  /** Page title */
  public readonly title = 'Pubudu Wijesooriya';

  /** Host element */
  private readonly host = inject(ElementRef<HTMLElement>);

  /** Destroy ref */
  private readonly destroyRef = inject(DestroyRef);

  /**
   * Use the subset icon font from the document head.
   * @param icons icon registry
   */
  constructor(icons: MatIconRegistry) {
    icons.setDefaultFontSetClass('material-symbols-outlined');
    afterNextRender(() => this.followHeaderHeight());
  }

  /**
   * Publish the navbar's real height so pages can sit against it.
   */
  private followHeaderHeight(): void {
    const header = this.host.nativeElement.querySelector('.pw-header-wrap');
    if (!(header instanceof HTMLElement)) {
      return;
    }
    const publish = (): void => {
      const { height } = header.getBoundingClientRect();
      if (height <= 0) {
        return;
      }
      document.documentElement.style.setProperty('--site-header-height', `${height}px`);
    };
    publish();
    if (typeof ResizeObserver === 'undefined') {
      return;
    }
    const observer = new ResizeObserver(publish);
    observer.observe(header);
    this.destroyRef.onDestroy(() => observer.disconnect());
  }
}
