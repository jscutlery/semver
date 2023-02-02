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

const groupSchema = z.object({
  name: z.string(),
  type: z.literal('group'),
  tagPrefix: z.string().optional(),
  path: z.string(),
  packages: z.array(
    z.object({
      name: z.string(),
      path: z.string(),
    })
  ),
});

const independentSchema = z.object({
  name: z.string(),
  type: z.literal('independent'),
  tagPrefix: z.string().optional(),
  path: z.string(),
});

const schema = z.object({
  packages: z.array(z.union([groupSchema, independentSchema])),
});

export type Config = z.infer<typeof schema>;
export type GroupConfig = z.infer<typeof groupSchema>;
export type IndependentConfig = z.infer<typeof independentSchema>;

function validate(config: unknown): Config {
  return schema.parse(config);
}
