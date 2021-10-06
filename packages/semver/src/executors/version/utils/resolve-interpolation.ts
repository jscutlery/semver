export interface ResolvingContext {
  [key: string]: string | boolean | number;
}

export function resolveInterpolation(
  template: string,
  resolvingContext: ResolvingContext
): string {
  return Object.keys(resolvingContext).reduce(
    (accumulator, contextParamKey) =>
      accumulator.replace(
        new RegExp(`\\$\\{${contextParamKey}}`, 'g'),
        resolvingContext[contextParamKey].toString()
      ),
    template
  );
}
