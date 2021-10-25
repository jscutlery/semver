export function resolveInterpolation(
  template: string,
  resolvingContext: Record<string, any>
): string | number | boolean {
  const resolvedValue = Object.keys(resolvingContext).reduce(
    (accumulator, contextParamKey) => {
      const interpolationRegex = new RegExp(`\\$\\{${contextParamKey}}`, 'g');
      return accumulator.replace(
        interpolationRegex,
        resolvingContext[contextParamKey].toString()
      );
    },
    template
  );

  if (_isBool(resolvedValue)) {
    return resolvedValue === "true";
  }

  if (_isNumeric(resolvedValue)) {
    return +resolvedValue;
  }

  return resolvedValue;
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
