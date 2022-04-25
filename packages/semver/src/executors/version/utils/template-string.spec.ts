import { coerce, createTemplateString } from './template-string';

describe(createTemplateString.name, () => {
  const testContext = { test1: 'xxx', test2: 'yyy' };

  it('should resolve noting', () => {
    expect(
      createTemplateString(
        'test string that have test1 and ${nothing} in it',
        testContext
      )
    ).toBe('test string that have test1 and ${nothing} in it');
  });

  it('should resolve ${test1} placeholders', () => {
    expect(
      createTemplateString(
        'test string with ${test1}, when ${test1} repeat itself',
        testContext
      )
    ).toBe('test string with xxx, when xxx repeat itself');
  });

  it('should resolve ${test1} and ${test2} placeholders', () => {
    expect(
      createTemplateString(
        'test string with ${test1} and ${test2}',
        testContext
      )
    ).toBe('test string with xxx and yyy');
  });

  it('should resolve boolean and numbers placeholders', () => {
    expect(
      createTemplateString('test string with ${num} and ${bool}', {
        num: 42,
        bool: true,
      })
    ).toBe('test string with 42 and true');
  });
});

describe(coerce.name, () => {
  it('should resolve true boolean', () => {
    expect(coerce(createTemplateString('${bool}', { bool: true }))).toBe(true);
  });

  it('should resolve false boolean', () => {
    expect(coerce(createTemplateString('${bool}', { bool: false }))).toBe(
      false
    );
  });

  it('should resolve number', () => {
    expect(coerce(createTemplateString('${num}', { num: 42 }))).toBe(42);
  });

  it('should handle multiple keys', () => {
    expect(
      coerce(createTemplateString('${num}', { num: 42, bool: true }))
    ).toBe(42);
  });

  it('should handle multiple interpolations', () => {
    expect(
      coerce(createTemplateString('${num} ${bool}', { num: 42, bool: true }))
    ).toBe('42 true');
  });
});
