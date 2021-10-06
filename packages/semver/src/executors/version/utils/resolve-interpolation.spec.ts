import { resolveInterpolation } from './resolve-interpolation';

describe(resolveInterpolation.name, () => {
  const testContext = { test1: 'xxx', test2: 'yyy' };

  it('should resolve noting', () => {
    expect(
      resolveInterpolation(
        'test string that have test1 and ${nothing} in it',
        testContext
      )
    ).toBe('test string that have test1 and ${nothing} in it');
  });

  it('should resolve ${test1} placeholders', () => {
    expect(
      resolveInterpolation(
        'test string with ${test1}, when ${test1} repeat itself',
        testContext
      )
    ).toBe('test string with xxx, when xxx repeat itself');
  });

  it('should resolve ${test1} and ${test2} placeholders', () => {
    expect(
      resolveInterpolation(
        'test string with ${test1} and ${test2}',
        testContext
      )
    ).toBe('test string with xxx and yyy');
  });

  it('should resolve boolean and numbers placeholders', () => {
    expect(
      resolveInterpolation(
        'test string with ${num} and ${bool}',
        { num: 42, bool: true }
      )
    ).toBe('test string with 42 and true');
  });

  it('should resolve boolean', () => {
    expect(
      resolveInterpolation(
        '${bool}',
        { bool: true }
      )
    ).toBe(true);
  });

  it('should resolve number', () => {
    expect(
      resolveInterpolation(
        '${num}',
        { num: 42 }
      )
    ).toBe(42);
  });
});
