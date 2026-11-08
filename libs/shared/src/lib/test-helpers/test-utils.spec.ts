import {
  callComponentMethod,
  getComponentProperty,
  spyOnMethod,
} from './test-utils';

/** A stand-in whose members stay off the public type. */
class Sample {
  /** Value the helper should read. */
  protected secret = 'hidden';

  /**
   * @param left first addend
   * @param right second addend
   * @returns the sum
   */
  protected add(left: number, right: number): number {
    return left + right;
  }

  /**
   * @param name person to greet
   * @returns a greeting
   */
  public greet(name: string): string {
    return `hi ${name}`;
  }
}

describe('test helpers', () => {
  let sample: Sample;

  beforeEach(() => {
    sample = new Sample();
  });

  describe('when a member is hidden from the test', () => {
    it('should read the field', () => {
      expect(getComponentProperty<string>(sample, 'secret')).toBe('hidden');
    });

    it('should call the method with its arguments', () => {
      expect(callComponentMethod<number>(sample, 'add', 2, 3)).toBe(5);
    });

    it('should spy on the method', () => {
      const greet = spyOnMethod(sample, 'greet');

      sample.greet('Ada');

      expect(greet).toHaveBeenCalledWith('Ada');
    });
  });
});
