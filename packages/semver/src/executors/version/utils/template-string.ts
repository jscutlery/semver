export function createTemplateString(
  template: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  context: Record<string, any>
): string {
  return Object.keys(context).reduce(
    (accumulator, contextParamKey) => {
      const interpolationRegex = new RegExp(`\\$\\{${contextParamKey}}`, 'g');
      return accumulator.replace(
        interpolationRegex,
        context[contextParamKey].toString()
      );
    },
    template
  );
}

export function coerce(value: string): string | number | boolean {
  if (_isBool(value)) {
    return value === "true";
  }

  if (_isNumeric(value)) {
    return +value;
  }

  return value;
}

function _isNumeric(value: unknown): boolean {
  if (typeof value !== 'string') {
    return false;
  }

  return !isNaN(+value) && !isNaN(parseFloat(value));
}

function _isBool(value: unknown): boolean {
  if (typeof value !== 'string') {
    return false;
  }

  return value === 'true' || value === 'false';
}
