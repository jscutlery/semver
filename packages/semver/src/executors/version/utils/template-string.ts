export function createTemplateString(
  template: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  context: Record<string, any>,
): string {
  return Object.keys(context).reduce((accumulator, contextParamKey) => {
    // @deprecated ${key} syntax is deprecated and will be removed in the next major version
    const interpolationRegex = new RegExp(
      `\\$\{${contextParamKey}}|\\{${contextParamKey}}`,
      'g',
    );
    return accumulator.replace(
      interpolationRegex,
      context[contextParamKey].toString(),
    );
  }, template);
}

export function coerce(value: string): string | number | boolean {
  if (_isBool(value)) {
    return value === 'true';
  }

  if (_isNumeric(value)) {
    return +value;
  }

  return value;
}

function _isNumeric(value: string): boolean {
  return !isNaN(+value) && !isNaN(parseFloat(value));
}

function _isBool(value: string): boolean {
  return value === 'true' || value === 'false';
}
