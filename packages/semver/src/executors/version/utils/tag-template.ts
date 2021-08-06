export interface TagTemplateContext {
  [key: string]: string;
}

export function resolveTagTemplate(template: string, resolvingContext: TagTemplateContext): string {
  return Object.keys(resolvingContext)
    .reduce((accumulator, contextParamKey) => accumulator
      .replace(new RegExp(`\\$\\{${contextParamKey}}`, 'g'),
        resolvingContext[contextParamKey]), template);
}
