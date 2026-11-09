import { socialDocPath } from './social';

describe('socialDocPath', () => {
  it.each([
    [1, 'social-infor-section/social-01'],
    [2, 'social-infor-section/social-02'],
    [3, 'social-infor-section/social-03'],
    [12, 'social-infor-section/social-12'],
  ])('should map id %i to %s', (id, expected) => {
    expect(socialDocPath(id)).toBe(expected);
  });
});
