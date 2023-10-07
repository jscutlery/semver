export function diff(before: string, after: string): string {
  const linesBefore = before.split('\n');
  const linesAfter = after.split('\n');

  const differentLines: string[] = [];

  let oldIndex = 0;
  for (const line of linesAfter) {
    if (line === linesBefore[oldIndex]) {
      oldIndex += 1;
    } else {
      differentLines.push(line);
    }
  }

  return differentLines.join('\n');
}
