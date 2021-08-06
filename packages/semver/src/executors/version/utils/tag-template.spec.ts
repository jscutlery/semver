import { resolveTagTemplate } from './tag-template';

describe('resolveTagTemplate', () => {
  const testContext = { test1: 'xxx', test2: 'yyy' };

  it('should do noting to the template string', () => {
    expect(resolveTagTemplate('test string that have test1 and ${nothing} in it', testContext))
      .toBe('test string that have test1 and ${nothing} in it');
  });

  it('should replace all ${test1} placeholders', () => {
    expect(resolveTagTemplate('test string with ${test1}, when ${test1} repeat itself', testContext))
      .toBe('test string with xxx, when xxx repeat itself');
  });

  it('should replace all ${test1} and ${test2} placeholders', () => {
    expect(resolveTagTemplate('test string with ${test1} and ${test2}', testContext))
      .toBe('test string with xxx and yyy');
  });
});
