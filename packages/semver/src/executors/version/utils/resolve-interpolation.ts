function _isNumeric(value: unknown): boolean {
  if (typeof value !== 'string') {
    return false;
  }

  return !isNaN(+value) && !isNaN(parseFloat(value));
}

function _isBool(value: unknown) : boolean {
  if (typeof value !== 'string') {
    return false;
  }

  return value === 'true' || value === 'false';
}

export function resolveInterpolation(
  template: string,
  resolvingContext: Record<string, unknown>
): string | number | boolean {
  return Object.keys(resolvingContext).reduce(
    (accumulator, contextParamKey) => {
      const interpolationRegex = new RegExp(`\\$\\{${contextParamKey}}`, 'g');
      const resolvedValue = accumulator.replace(
        interpolationRegex,
        resolvingContext[contextParamKey].toString()
      );

      if (accumulator === template && _isNumeric(resolvedValue)) {
        return +resolvedValue;
      }

      if (accumulator === template && _isBool(resolvedValue)) {
        return !!resolvedValue;
      }

      return resolvedValue;
    },
    template
  );
}
