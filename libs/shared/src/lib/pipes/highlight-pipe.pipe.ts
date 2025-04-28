import {
  Pipe,
  PipeTransform,
} from '@angular/core';

/**
 * Highlight marked text
 */
@Pipe({
  name: 'highlightPipe',
  standalone: true,
})
export class HighlightPipePipe implements PipeTransform {
  /**
   * retunrs highlighted string
   * @param text text string
   * @returns html string
   */
  public transform(text: string): string {
    if (!text) return '';
    return text.replace(/\[(.*?)\]/g, '<span class="highlight-tech">$1</span>');
  }
}
