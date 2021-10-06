import type { GithubExecutorSchema } from './schema';

export default async function runExecutor(
  options: GithubExecutorSchema,
) {
  console.log('Executor ran for Github', options)
  return {
    success: true
  }
}

