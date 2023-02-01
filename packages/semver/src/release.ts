import { createProjectGraphAsync } from '@nrwl/devkit';

export async function release(): Promise<void> {
  const graph = await createProjectGraphAsync({
    exitOnError: true,
    resetDaemonClient: false,
  });

  console.log(graph);
}
