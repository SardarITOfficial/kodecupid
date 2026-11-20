import { nextIncompleteStep, ONBOARDING_SEQUENCE, stepIndex } from './onboarding.sequence';

describe('onboarding resume', () => {
  it('starts at welcome when nothing is completed', () => {
    expect(nextIncompleteStep([])).toBe('welcome');
  });

  it('returns the first missing step, regardless of completion order', () => {
    expect(nextIncompleteStep(['welcome', 'identity'])).toBe('profession');
    expect(nextIncompleteStep(['welcome', 'profession'])).toBe('identity');
  });

  it('reports complete when every step is done', () => {
    expect(nextIncompleteStep([...ONBOARDING_SEQUENCE])).toBe('complete');
  });

  it('ignores duplicate completed steps', () => {
    expect(nextIncompleteStep(['welcome', 'welcome'])).toBe('identity');
  });

  it('knows the order of the steps', () => {
    expect(ONBOARDING_SEQUENCE).toEqual([
      'welcome',
      'identity',
      'profession',
      'location',
      'preferences',
      'privacy',
    ]);
    expect(stepIndex('location')).toBe(3);
    expect(stepIndex('complete')).toBe(0);
  });
});
