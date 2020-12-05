import { BuilderContext, BuilderOutput, createBuilder } from '@angular-devkit/architect';
import { noop } from '@angular-devkit/schematics';
import { exec } from '@lerna/child-process';
import { resolve } from 'path';
import { defer, from, Observable, of, throwError } from 'rxjs';
import { catchError, mapTo, switchMap, switchMapTo } from 'rxjs/operators';
import * as standardVersion from 'standard-version';

import { VersionBuilderSchema } from './schema';

async function getProjectRoot(context: BuilderContext): Promise<string> {
  const metadata = await context.getProjectMetadata(context.target.project);
  return metadata.root as string;
}

function pushToGitRemote({
  remote,
  branch,
  context,
  noVerify,
}: {
  remote: string;
  branch: string;
  context: BuilderContext;
  noVerify: boolean;
}): Promise<void> {
  const gitPushOptions = [
    '--follow-tags',
    ...(noVerify ? ['--no-verify'] : []),
  ];

  return exec('git', [
    'push',
    ...gitPushOptions,
    '--atomic',
    remote,
    branch,
  ]).catch((error) => {
    // @see https://github.com/sindresorhus/execa/blob/v1.0.0/index.js#L159-L179
    // the error message _should_ be on stderr except when GIT_REDIRECT_STDERR has been configured to redirect
    // to stdout. More details in https://git-scm.com/docs/git#Documentation/git.txt-codeGITREDIRECTSTDERRcode
    if (
      /atomic/.test(error.stderr) ||
      (process.env.GIT_REDIRECT_STDERR === '2>&1' &&
        /atomic/.test(error.stdout))
    ) {
      // --atomic is only supported in git >=2.4.0, which some crusty CI environments deem unnecessary to upgrade.
      // so let's try again without attempting to pass an option that is almost 5 years old as of this writing...
      context.logger.warn('git push ' + error.stderr);
      context.logger.info(
        'git push --atomic failed, attempting non-atomic push'
      );

      return exec('git', ['push', ...gitPushOptions, remote, branch]);
    }

    // ensure unexpected errors still break chain
    throw error;
  });
}

function tryPushingToGitRemote({
  remote,
  branch,
  noVerify,
  context,
}: {
  remote: string;
  branch: string;
  context: BuilderContext;
  noVerify: boolean;
}): Observable<any> {
  if (remote == null || branch == null) {
    context.logger.error(
      'Missing configuration for Git push, please provide --remote and --branch options, see: https://github.com/jscutlery/semver#configure' +
        '\n' +
        'Skipping git push...'
    );

    return throwError('Missing configuration');
  }

  return defer(() =>
    pushToGitRemote({
      remote,
      branch,
      noVerify,
      context,
    })
  );
}

export function runBuilder(
  options: VersionBuilderSchema,
  context: BuilderContext
): Observable<BuilderOutput> {
  const { push, remote, dryRun, baseBranch, noVerify, firstRelease } = options;

  return from(getProjectRoot(context)).pipe(
    switchMap((projectRoot) =>
      standardVersion({
        silent: false,
        path: projectRoot,
        dryRun,
        noVerify,
        firstRelease,
        infile: resolve(projectRoot, 'CHANGELOG.md'),
        packageFiles: [resolve(projectRoot, 'package.json')],
        bumpFiles: [resolve(projectRoot, 'package.json')],
        preset: require.resolve('conventional-changelog-angular'),
      })
    ),
    push && dryRun === false
      ? switchMapTo(
          tryPushingToGitRemote({
            branch: baseBranch,
            remote,
            noVerify,
            context,
          })
        )
      : mapTo(noop()),
    mapTo({ success: true }),
    catchError(() => {
      context.reportStatus('Error');
      return of({ success: false });
    })
  );
}

export default createBuilder(runBuilder);
