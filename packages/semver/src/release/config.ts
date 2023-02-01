import { readFile } from 'fs/promises';
import { resolve } from 'path';
import { cwd } from 'process';
import * as z from 'zod';

export async function getConfig(): Promise<Config> {
  try {
    const config = await readFile(resolve(cwd(), 'semver.json'), 'utf-8');
    return validate(JSON.parse(config));
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      throw new Error('Could not find semver.json');
    }
    if (error instanceof z.ZodError) {
      throw new Error(`Invalid semver.json`);
    }
    throw error;
  }
}

const schema = z.object({
  packages: z.array(
    z.union([
      z.object({
        name: z.string(),
        type: z.literal('group'),
        packages: z.array(
          z.object({
            name: z.string(),
            path: z.string(),
          })
        ),
      }),
      z.object({
        name: z.string(),
        type: z.literal('independent'),
        path: z.string(),
      }),
    ])
  ),
});

export type Config = z.infer<typeof schema>;

function validate(config: unknown): Config {
  return schema.parse(config);
}
