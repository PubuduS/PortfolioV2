import * as _ from 'lodash';
import { Injectable } from '@angular/core';

/**
 * Utility Service
 */
@Injectable({
  providedIn: 'root',
})
export class UtilityService {
  /**
   * constructor
   */
  constructor() {}

  /**
   * Break long string into paragraphs based on new line.
   * @param value long sentence
   * @returns array of strings
   */
  public breakStringToParagraphs(value: string): string[] {
    const introArray: string[] = _.pull(value.split('\n'), '');
    return introArray;
  }

  /**
   * Separate paragraphs by adding new lines
   * @param longSentence long sentence
   * @returns string with multiple paragraphs separated by new line.
   */
  public seperateSentences(longSentence: string[] | undefined): string {
    if (!longSentence) {
      return '';
    }

    let paragraphs = '';
    longSentence?.forEach((param) => {
      paragraphs += `${param}\n\n`;
    });
    return _.trim(paragraphs);
  }
}
