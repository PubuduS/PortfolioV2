import { FormControl } from '@angular/forms';

import { monthValidator } from './month-validator';

describe('monthValidator', () => {
  const validate = monthValidator();

  describe('when the control is empty', () => {
    it.each([null, undefined, ''])('should accept %p', (value) => {
      expect(validate(new FormControl(value))).toBeNull();
    });
  });

  describe('when the month is from 1 through 12', () => {
    it.each([1, 12, '1', '6', '12'])('should accept %p', (value) => {
      expect(validate(new FormControl(value))).toBeNull();
    });
  });

  describe('when the month is outside 1 through 12', () => {
    it.each(['0', '13', '-1', 'x'])('should reject %p', (value) => {
      expect(validate(new FormControl(value))).toEqual({ invalidMonth: true });
    });
  });
});
