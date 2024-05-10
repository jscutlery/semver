<a href="https://www.npmjs.com/package/@jscutlery/semver" rel="nofollow">
  <img src="https://badgen.net/npm/v/@jscutlery/semver" alt="@jscutlery/semver NPM package">
</a>

<a href="https://codecov.io/gh/jscutlery/semver" rel="nofollow">
  <img src="https://codecov.io/gh/jscutlery/semver/branch/main/graph/badge.svg?token=6LFY2EJ6UG" alt="@jscutlery/semver coverage status" />
</a>

# @jscutlery/semver

**Nx plugin for versioning** using [SemVer](https://semver.org/) and **CHANGELOG generation** powered by [Conventional Commits](https://conventionalcommits.org).

## Setup

### Install

```sh
npm install -D @jscutlery/semver
nx g @jscutlery/semver:install
```

This package allows you to manage your Nx workspace using one of two modes: **Synced** or **Independent**.

#### Independent mode (default)

Allow multiple projects to be versioned independently. This way you release only what you want and consumers don't get updates they don't need. This allows small, rapid and incremental adoption of your packages.

#### Synced mode

Allow multiple projects to be versioned in a synced/locked mode. Use this if you want to automatically tie all package versions together. This mode is useful when you are working with only one product. One issue with this approach is that a major change in any project will result in all projects having a new major version.

## Usage

### Release

#### Independent mode

Release project independently by running:

```
nx run my-project:version [...options]
```

You can leverage the affected command to only version changed packages:

```
nx affected --target version [...options]
```

#### Synced mode

Release workspace by running:

```
nx run workspace:version [...options]
```

#### When run, this executor does the following

1. Retrieve the current version by looking at the last `git tag`.
2. Bump `package.json` version based on the commits.
3. Generates CHANGELOG based on the commits (uses [conventional-changelog-angular](https://github.com/conventional-changelog/conventional-changelog/tree/master/packages/conventional-changelog-angular) under the hood).
4. Creates a new commit including the `package.json` file and updated CHANGELOG.
5. Creates a new tag with the new version number.
6. Pushes the version to the remote repository.
7. Runs post-targets hook to publish the version on NPM, GitHub or GitLab.

#### Available options

| name                         | type               | default     | description                                                                                                                                                     |
| ---------------------------- | ------------------ | ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`--dryRun`**               | `boolean`          | `false`     | run with dry mode                                                                                                                                               |
| **`--noVerify`**             | `boolean`          | `false`     | skip git hooks                                                                                                                                                  |
| **`--push`**                 | `boolean`          | `false`     | push the release to the remote repository                                                                                                                       |
| **`--syncVersions`**         | `boolean`          | `false`     | lock/sync versions between projects                                                                                                                             |
| **`--skipRootChangelog`**    | `boolean`          | `false`     | skip generating root changelog                                                                                                                                  |
| **`--skipProjectChangelog`** | `boolean`          | `false`     | skip generating project changelog                                                                                                                               |
| **`--origin`**               | `string`           | `'origin'`  | push against git remote repository                                                                                                                              |
| **`--baseBranch`**           | `string`           | `'main'`    | push against git base branch                                                                                                                                    |
| **`--changelogHeader`**      | `string`           | `undefined` | custom Markdown header for changelogs                                                                                                                           |
| **`--releaseAs`**            | `string`           | `undefined` | specify the level of change ([details](https://github.com/jscutlery/semver#specify-the-level-of-change))                                                        |
| **`--preid`**                | `string`           | `undefined` | specify the prerelease identifier (eg: alpha, beta) ([details](https://github.com/jscutlery/semver#specify-the-level-of-change))                                |
| **`--tagPrefix`**            | `string`           | `undefined` | specify the tag prefix ([details](https://github.com/jscutlery/semver#tag-prefix-customization))                                                                |
| **`--postTargets`**          | `string[]`         | `[]`        | specify the list of target to execute post-release ([details](https://github.com/jscutlery/semver#triggering-executors-post-release))                           |
| **`--trackDeps`**            | `boolean`          | `false`     | bump dependent packages (bump A if A depends on B) ([details](https://github.com/jscutlery/semver#tracking-dependencies))                                       |
| **`--allowEmptyRelease`**    | `boolean`          | `false`     | force a patch increment even if library source didn't change                                                                                                    |
| **`--skipCommitTypes`**      | `string[]`         | `[]`        | treat commits with specified types as non invoking version bump ([details](https://github.com/jscutlery/semver#skipping-release-for-specific-types-of-commits)) |
| **`--skipCommit`**           | `boolean`          | `false`     | skips generating a new commit, leaves all changes in index, tag would be put on last commit ([details](https://github.com/jscutlery/semver#skipping-commit))    |
| **`--commitMessageFormat`**  | `string`           | `undefined` | format the auto-generated message commit ([details](https://github.com/jscutlery/semver#commit-message-customization))                                          |
| **`--preset`**               | `string \| object` | `'angular'` | customize Conventional Changelog options ([details](https://github.com/jscutlery/semver#customizing-conventional-changelog))                                    |
| **`--commitParserOptions`**  | `object`           | `undefined` | customize the commit parserConfig ([details](https://github.com/jscutlery/semver#customizing-the-commit-parser))                                                |

## Guides

### Overwrite default configuration

You can customize the default configuration using the definition file:

```json
{
  "executor": "@jscutlery/semver:version",
  "options": {
    "baseBranch": "master",
    "preset": "atom",
    "tagPrefix": "{projectName}@"
  }
}
```

### Customizing Conventional Changelog

This tool comes with a list of pre-configured presets:

- [angular](https://github.com/conventional-changelog/conventional-changelog/tree/master/packages/conventional-changelog-angular) (default)
- [conventionalcommits](https://github.com/conventional-changelog/conventional-changelog/tree/master/packages/conventional-changelog-conventionalcommits)

<details>
  <summary>Complete list of presets</summary>
  
  - [angular](https://github.com/conventional-changelog/conventional-changelog/tree/master/packages/conventional-changelog-angular) (default)
  - [conventionalcommits](https://github.com/conventional-changelog/conventional-changelog/tree/master/packages/conventional-changelog-conventionalcommits)
  - [atom](https://github.com/conventional-changelog/conventional-changelog/tree/master/packages/conventional-changelog-atom)
  - [codemirror](https://github.com/conventional-changelog/conventional-changelog/tree/master/packages/conventional-changelog-codemirror)
  - [ember](https://github.com/conventional-changelog/conventional-changelog/tree/master/packages/conventional-changelog-ember)
  - [eslint](https://github.com/conventional-changelog/conventional-changelog/tree/master/packages/conventional-changelog-eslint)
  - [express](https://github.com/conventional-changelog/conventional-changelog/tree/master/packages/conventional-changelog-express)
  - [jquery](https://github.com/conventional-changelog/conventional-changelog/tree/master/packages/conventional-changelog-jquery)
  - [jshint](https://github.com/conventional-changelog/conventional-changelog/tree/master/packages/conventional-changelog-jshint)
</details>

The preset is highly configurable, following the [conventional-changelog-config-spec](https://github.com/conventional-changelog/conventional-changelog-config-spec). As an example, suppose you're using GitLab, rather than GitHub, you might modify the following variables:

```json
{
  "executor": "@jscutlery/semver:version",
  "options": {
    "preset": {
      "commitUrlFormat": "{{host}}/{{owner}}/{{repository}}/commit/{{hash}}",
      "compareUrlFormat": "{{host}}/{{owner}}/{{repository}}/compare/{{previousTag}}...{{currentTag}}",
      "issueUrlFormat": "{{host}}/{{owner}}/{{repository}}/issues/{{id}}",
      "types": [
        { "type": "feat", "section": "✨ Features" },
        { "type": "fix", "section": "🐞 Bug Fixes" },
        { "type": "chore", "hidden": true }
      ]
    }
  }
}
```

> [!NOTE]
> When customizing a preset it will implicitly use the [conventionalcommits](https://github.com/conventional-changelog/conventional-changelog/tree/master/packages/conventional-changelog-conventionalcommits) preset and override the default settings with the given configuration.

It is possible to customize any preset by passing its name.

```json
{
  "executor": "@jscutlery/semver:version",
  "options": {
    "preset": {
      "name": "angular",
      "types": [
        { "type": "feat", "section": "✨ Features" },
        { "type": "fix", "section": "🐞 Bug Fixes" }
      ]
    }
  }
}
```

See the [conventional-changelog-config-spec](https://github.com/conventional-changelog/conventional-changelog-config-spec) for available
configuration options.

### Customizing the commit parser

You may customize the config for the commit parser. This can be helpful when you are using an adapted version of conventional commit for instance.

```json
{
  "executor": "@jscutlery/semver:version",
  "options": {
    "commitParserOptions": {
      "headerPattern": "^([A-Z]{3,}-\\d{1,5}):? (chore|build|ci|docs|feat|fix|perf|refactor|test)(?:\\(([\\w-]+)\\))?\\S* (.+)$",
      "headerCorrespondence": ["ticketReference", "type", "scope", "subject"]
    }
  }
}
```

See the [conventional-commits-parse](https://github.com/conventional-changelog/conventional-changelog/tree/master/packages/conventional-commits-parser#options) specification for available configuration options.

### Version calculation

This package is **tag-based**, which means it never reads the `package.json` to retrieve the current version. Instead, it looks for a tag matching the `--tagPrefix` (i.e `demo-x.y.z`). Then, if no tag is found it fallbacks to `0.0.0`, and calculates the initial version based on all changes since the first commit. In the other case, if there are matching tags, it retrieves the last one and calculates the new version from it.

> [!IMPORTANT]
> To detect a new version this package looks into the commit history and checks if any source files changed since the last version. Note that merge commits are ignored by the tool when calculating next version to bump.

Major zero version `0.x.y` is for initial development. Anything may change at any time so the consumer won't get any new minor version using the caret or tilde compatibility range, for instance version `0.3.1` won't be resolved if the consumer wants `^0.2.0`.

#### Specify the level of change

The **`--releaseAs`** option allows you to release a project with a version that is incremented by a specified level.

Level can be one of `major`, `minor`, `patch`, `premajor`, `preminor`, `prepatch`, or `prerelease`, for instance:

```
nx run workspace:version --releaseAs=major
nx run workspace:version --releaseAs=minor
nx run workspace:version --releaseAs=patch
nx run workspace:version --releaseAs=prerelease --preid=alpha
nx run workspace:version --releaseAs=prerelease --preid=beta
```

#### Initial prerelease version

When using the `--releaseAs=prerelease` option, the initial prerelease version takes into account the commit history to determine the recommended bump type. As an illustration, let's assume the current version is `1.0.0`, and the commit history includes the following:

- **Commit 1:** `feat(my-project): abc`
- **Commit 2:** `fix(my-project): def`

Running the following command:

```bash
nx version my-project --releaseAs=prerelease --preid=alpha
```

Would yield the version `1.1.0-alpha.0`. Subsequent executions of the command would result in incremented prerelease versions, such as `1.1.0-alpha.1`.

### Tag prefix customization

The **`--tagPrefix`** option allows you to customize the tag prefix.

In sync mode only one tag is created for the whole workspace, the tag prefix is set to `v` by default, which is resolved for instance to `v0.0.1`.

In independent mode, the tag prefix uses the contextual project name, the default value is `{projectName}-` which is resolved for instance to `my-project-0.0.1`. Note that each project in the workspace is versioned with its tag.

### Commit message customization

The **`--commitMessageFormat`** option allows you to customize the commit message. By default, the commit message is formatted as the following:

```
chore({projectName}): release version {version}
```

Contextual variables resolved by this option:

- `version` the current release version (for instance `1.0.0`)
- `projectName` the project name to be versioned (for instance `my-project`)

Note that it's the right place to add common keywords to skip CI workflows, for example: `[skip ci]` for GitHub, eg:

```
release: bump {projectName} to {version} [skip ci]
```

### Skipping release for specific types of commits

To avoid releasing a new version if something non-influencing on release was changed (for example, documentation), you can provide `skipCommitTypes` option.
In this case, any commit with a specified type would be ignored when calculating if there is a need to bump version.
For example, if you had only one commit from the last version:

```
docs(project): update documentation about new feature
```

would not cause a new release (because `--skipCommitTypes=docs,ci` was specified).

And two commits:

```
docs(project): update documentation about new feature
fix(project): get rig of annoying bug
```

would produce a patch bump.

> [!NOTE]
> Please keep in mind that changelog would be generated by [conventional-changelog](https://github.com/conventional-changelog/conventional-changelog/tree/master/packages/conventional-changelog-angular#type) which ignores some types by design (i.e. `docs`, `test` and others).

### Skipping commit

In some cases, your release process relies only on tags and you don't want a new commit with version bumps and changelog updates to be made.
To achieve this, you can provide the `--skipCommit` flag and changes made by the library would stay in the index without committing.
The tag for the new version would be put on the last existing commit.

### Triggering executors post-release

The **`--postTargets`** option allows you to run targets post-release. This is particularly handful for publishing packages on a registry or scheduling any other task.

Here is a configuration example using [`@jscutlery/semver:github`](https://github.com/jscutlery/semver/blob/main/packages/semver/src/executors/github/README.md) to create a GitHub Release and [`ngx-deploy-npm:deploy`](https://github.com/bikecoders/ngx-deploy-npm) to publish on NPM:

```jsonc
{
  "targets": {
    "build": {
      /* ... */
    },
    "version": {
      "executor": "@jscutlery/semver:version",
      "options": {
        "push": true,
        "postTargets": ["build", "npm", "github"],
      },
    },
    "github": {
      "executor": "@jscutlery/semver:github",
      "options": {
        "tag": "{tag}",
        "notes": "{notes}",
      },
    },
    "npm": {
      "executor": "ngx-deploy-npm:deploy",
      "options": {
        "access": "public",
        "distFolderPath": "dist/packages/my-package",
      },
    },
  },
}
```

Contextual variables resolved by this option:

- `projectName` versioned project name
- `version` semver version
- `tag` formatted git tag
- `notes` release notes
- `previousTag` previous version tag
- `dryRun` dry run mode

> [!NOTE]
> The specified targets are going to be executed as is, without triggering any dependencies. It will not trigger the target's `dependsOn` and Nx caching is not considered

#### Built-in post-targets

- [`@jscutlery/semver:github`](https://github.com/jscutlery/semver/blob/main/packages/semver/src/executors/github/README.md) GiHub Release Support
- [`@jscutlery/semver:gitlab`](https://github.com/jscutlery/semver/blob/main/packages/semver/src/executors/gitlab/README.md) GitLab Release Support

### Tracking dependencies

The **`--trackDeps`** option indicates that direct dependencies in the project's dependency graph should be taken into account when incrementing the
version. If no version-incrementing changes are present in the project but are present in one or more dependencies, then the project will receive a `patch`
version increment.

If you wish to track changes at any depth of your dependency graph, then you should do the following:

1. Enable versioning for each project in the dependency graph
2. Set the `trackDeps` option to `true` on each of the projects
3. Make sure that `version` is run on projects in the right order by configuring `version`'s target dependencies in `nx.json`:

```json
{
  "targetDefaults": {
    "version": {
      "dependsOn": ["^version"]
    }
  }
}
```

This setup will cause a cascade of version increments starting at the deepest changed dependency,
then continuing up the graph until the indicated project is reached.
Additionally, if used in conjunction with `nx run-many --all`, or `nx affected`,
then it will avoid attempting to version dependencies multiple times.

> [!WARNING]  
> Be aware that this feature has known [limitations](https://github.com/jscutlery/semver/issues/526).

## CI/CD usage

### GitHub Actions

Here is an example running semver in a GitHub workflow:

```yml
name: release

on:
  - workflow_dispatch

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0
      - name: Use Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '16'
      - name: Setup Git
        run: |
          git config user.name "GitHub Bot"
          git config user.email "gituser@example.com"
      - run: yarn install --frozen-lockfile
      - name: Version
        shell: bash
        run: yarn nx affected --base=last-release --target=version
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
      - name: Tag last-release
        shell: bash
        run: |
          git tag -f last-release
          git push origin last-release --force
```

Note that `secrets.GITHUB_TOKEN` is automatically provided by the GitHub Actions, you don't need to set up anything.

### GitLab CI

Here is an example running semver in the GitLab CI:

```yml
stages:
  - release

release:
  rules:
    - if: $CI_COMMIT_BRANCH == "master"
      when: manual
  stage: release
  image: node:16.13.2
  before_script:
    - git config --global user.name "GitLab Bot"
    - git config --global user.email "gituser@example.com"
    - git remote set-url origin http://gitlab-ci-token:${DEPLOY_KEY}@gitlab.com/org/project.git
  script:
    - yarn install --frozen-lockfile
    - yarn nx affected --target=version --base=last-release
    - git tag -f last-release
    - git push origin last-release --force -o ci.skip
```

Note that you might need to configure a [deploy key](https://docs.gitlab.com/ee/user/project/deploy_keys/) in order to push to your remote repository.

## Nx Release migration

If you want to migrate to Nx Release, run the following command:

```bash
nx g @jscutlery/semver:migrate-nx-release
```

By executing this generator, the existing `@jscutlery/semver` configuration will be removed, and Nx Release will be appropriately configured for your projects.

> [!NOTE]
> The migration process does not currently support the sync mode.
> Complex or highly customized configurations may require additional manual adjustments after running the migration generator.
> After running this generator, you will need to adjust any custom scripts or CI workflows related to versioning and releases to align with the new Nx release workflow.

For more details on using Nx Release, refer to the [official Nx documentation](https://nx.dev/recipes/nx-release/get-started-with-nx-release#get-started-with-nx-release).

## Compatibility overview with Nx

| Version | Required Package          |
| ------- | ------------------------- |
| v5.3.0  | `@nx/devkit ^19.0.0`      |
| v5.0.0  | `@nx/devkit ^18.0.0`      |
| v4.0.0  | `@nx/devkit ^17.0.0`      |
| v3.0.0  | `@nx/devkit ^16.0.0`      |
| v2.28.0 | `@nrwl/devkit ^15.0.0`    |
| v2.23.0 | `@nrwl/devkit ^14.0.0`    |
| v2.12.0 | `@nrwl/workspace ^13.0.0` |
| v2.4.0  | `@nrwl/workspace ^12.0.0` |
| v1.0.0  | `@nrwl/workspace ^11.0.0` |

## Changelog

For new features or breaking changes [see the changelog](https://github.com/jscutlery/semver/blob/main/packages/semver/CHANGELOG.md).

## Contributors

This project follows the [all-contributors](https://github.com/all-contributors/all-contributors) specification.

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tbody>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://marmicode.io/"><img src="https://avatars2.githubusercontent.com/u/2674658?v=4?s=60" width="60px;" alt="Younes Jaaidi"/><br /><sub><b>Younes Jaaidi</b></sub></a><br /><a href="https://github.com/jscutlery/semver/issues?q=author%3Ayjaaidi" title="Bug reports">🐛</a> <a href="https://github.com/jscutlery/semver/commits?author=yjaaidi" title="Code">💻</a> <a href="https://github.com/jscutlery/semver/commits?author=yjaaidi" title="Documentation">📖</a> <a href="#example-yjaaidi" title="Examples">💡</a> <a href="#ideas-yjaaidi" title="Ideas, Planning, & Feedback">🤔</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://www.codamit.dev/"><img src="https://avatars0.githubusercontent.com/u/8522558?v=4?s=60" width="60px;" alt="Edouard Bozon"/><br /><sub><b>Edouard Bozon</b></sub></a><br /><a href="https://github.com/jscutlery/semver/issues?q=author%3Aedbzn" title="Bug reports">🐛</a> <a href="https://github.com/jscutlery/semver/commits?author=edbzn" title="Code">💻</a> <a href="https://github.com/jscutlery/semver/commits?author=edbzn" title="Documentation">📖</a> <a href="#example-edbzn" title="Examples">💡</a> <a href="#ideas-edbzn" title="Ideas, Planning, & Feedback">🤔</a></td>
      <td align="center" valign="top" width="14.28%"><a href="http://betaagency.ru/"><img src="https://avatars.githubusercontent.com/u/1610882?v=4?s=60" width="60px;" alt="Gleb Mikheev"/><br /><sub><b>Gleb Mikheev</b></sub></a><br /><a href="#ideas-glebmachine" title="Ideas, Planning, & Feedback">🤔</a></td>
      <td align="center" valign="top" width="14.28%"><a href="http://chigix.com/"><img src="https://avatars.githubusercontent.com/u/2692787?v=4?s=60" width="60px;" alt="Richard Lea"/><br /><sub><b>Richard Lea</b></sub></a><br /><a href="https://github.com/jscutlery/semver/commits?author=chigix" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/Katona"><img src="https://avatars.githubusercontent.com/u/1146931?v=4?s=60" width="60px;" alt="Katona"/><br /><sub><b>Katona</b></sub></a><br /><a href="https://github.com/jscutlery/semver/issues?q=author%3AKatona" title="Bug reports">🐛</a> <a href="https://github.com/jscutlery/semver/commits?author=Katona" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/ntziolis"><img src="https://avatars.githubusercontent.com/u/265338?v=4?s=60" width="60px;" alt="ntziolis"/><br /><sub><b>ntziolis</b></sub></a><br /><a href="https://github.com/jscutlery/semver/issues?q=author%3Antziolis" title="Bug reports">🐛</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/RicardoJBarrios"><img src="https://avatars.githubusercontent.com/u/14352238?v=4?s=60" width="60px;" alt="RicardoJBarrios"/><br /><sub><b>RicardoJBarrios</b></sub></a><br /><a href="https://github.com/jscutlery/semver/commits?author=RicardoJBarrios" title="Code">💻</a> <a href="#ideas-RicardoJBarrios" title="Ideas, Planning, & Feedback">🤔</a></td>
    </tr>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/sylvainar"><img src="https://avatars.githubusercontent.com/u/9823286?v=4?s=60" width="60px;" alt="Sylvain Arnouts"/><br /><sub><b>Sylvain Arnouts</b></sub></a><br /><a href="https://github.com/jscutlery/semver/issues?q=author%3Asylvainar" title="Bug reports">🐛</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/GethsLeader"><img src="https://avatars.githubusercontent.com/u/7333062?v=4?s=60" width="60px;" alt="GethsLeader"/><br /><sub><b>GethsLeader</b></sub></a><br /><a href="https://github.com/jscutlery/semver/commits?author=GethsLeader" title="Code">💻</a> <a href="#ideas-GethsLeader" title="Ideas, Planning, & Feedback">🤔</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/shaharkazaz"><img src="https://avatars.githubusercontent.com/u/17194830?v=4?s=60" width="60px;" alt="Shahar Kazaz"/><br /><sub><b>Shahar Kazaz</b></sub></a><br /><a href="https://github.com/jscutlery/semver/commits?author=shaharkazaz" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/miluoshi"><img src="https://avatars.githubusercontent.com/u/1130547?v=4?s=60" width="60px;" alt="Miloš Lajtman"/><br /><sub><b>Miloš Lajtman</b></sub></a><br /><a href="https://github.com/jscutlery/semver/issues?q=author%3Amiluoshi" title="Bug reports">🐛</a> <a href="https://github.com/jscutlery/semver/commits?author=miluoshi" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/hcharley"><img src="https://avatars.githubusercontent.com/u/1542740?v=4?s=60" width="60px;" alt="Charley Bodkin"/><br /><sub><b>Charley Bodkin</b></sub></a><br /><a href="https://github.com/jscutlery/semver/issues?q=author%3Ahcharley" title="Bug reports">🐛</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://jefiozie.github.io/"><img src="https://avatars.githubusercontent.com/u/17835373?v=4?s=60" width="60px;" alt="Jeffrey Bosch"/><br /><sub><b>Jeffrey Bosch</b></sub></a><br /><a href="https://github.com/jscutlery/semver/commits?author=Jefiozie" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/RaviTejaVattem"><img src="https://avatars.githubusercontent.com/u/43704759?v=4?s=60" width="60px;" alt="RaviTejaVattem"/><br /><sub><b>RaviTejaVattem</b></sub></a><br /><a href="https://github.com/jscutlery/semver/commits?author=RaviTejaVattem" title="Code">💻</a></td>
    </tr>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://abishek.is-a.dev/"><img src="https://avatars.githubusercontent.com/u/43115551?v=4?s=60" width="60px;" alt="Abishek PY"/><br /><sub><b>Abishek PY</b></sub></a><br /><a href="https://github.com/jscutlery/semver/commits?author=vj-abishek" title="Code">💻</a> <a href="https://github.com/jscutlery/semver/commits?author=vj-abishek" title="Documentation">📖</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/hinogi"><img src="https://avatars.githubusercontent.com/u/4602609?v=4?s=60" width="60px;" alt="Stefan Schneider"/><br /><sub><b>Stefan Schneider</b></sub></a><br /><a href="https://github.com/jscutlery/semver/commits?author=hinogi" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/CaffeinatedCodeMonkey"><img src="https://avatars.githubusercontent.com/u/5892586?v=4?s=60" width="60px;" alt="Travis Jones"/><br /><sub><b>Travis Jones</b></sub></a><br /><a href="https://github.com/jscutlery/semver/commits?author=CaffeinatedCodeMonkey" title="Code">💻</a> <a href="https://github.com/jscutlery/semver/commits?author=CaffeinatedCodeMonkey" title="Documentation">📖</a> <a href="#ideas-CaffeinatedCodeMonkey" title="Ideas, Planning, & Feedback">🤔</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/HassenHichri"><img src="https://avatars.githubusercontent.com/u/10193983?v=4?s=60" width="60px;" alt="Hichri Hassen"/><br /><sub><b>Hichri Hassen</b></sub></a><br /><a href="https://github.com/jscutlery/semver/issues?q=author%3AHassenHichri" title="Bug reports">🐛</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/GarethDJohn"><img src="https://avatars.githubusercontent.com/u/28591718?v=4?s=60" width="60px;" alt="Gareth John"/><br /><sub><b>Gareth John</b></sub></a><br /><a href="https://github.com/jscutlery/semver/commits?author=GarethDJohn" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/dianjuar"><img src="https://avatars.githubusercontent.com/u/7026066?v=4?s=60" width="60px;" alt="Diego Juliao"/><br /><sub><b>Diego Juliao</b></sub></a><br /><a href="https://github.com/jscutlery/semver/issues?q=author%3Adianjuar" title="Bug reports">🐛</a> <a href="https://github.com/jscutlery/semver/commits?author=dianjuar" title="Code">💻</a> <a href="#ideas-dianjuar" title="Ideas, Planning, & Feedback">🤔</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/ChazUK"><img src="https://avatars.githubusercontent.com/u/768108?v=4?s=60" width="60px;" alt="Charlie Francis"/><br /><sub><b>Charlie Francis</b></sub></a><br /><a href="https://github.com/jscutlery/semver/issues?q=author%3AChazUK" title="Bug reports">🐛</a></td>
    </tr>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/hpierre74"><img src="https://avatars.githubusercontent.com/u/25172711?v=4?s=60" width="60px;" alt="Pierre Huyghe"/><br /><sub><b>Pierre Huyghe</b></sub></a><br /><a href="https://github.com/jscutlery/semver/commits?author=hpierre74" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://gitlab.com/wsedlacek"><img src="https://avatars.githubusercontent.com/u/8206108?v=4?s=60" width="60px;" alt="William Sedlacek"/><br /><sub><b>William Sedlacek</b></sub></a><br /><a href="https://github.com/jscutlery/semver/commits?author=wSedlacek" title="Code">💻</a> <a href="#ideas-wSedlacek" title="Ideas, Planning, & Feedback">🤔</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://palmtreecoding.com/"><img src="https://avatars.githubusercontent.com/u/7668692?v=4?s=60" width="60px;" alt="Tycho Bokdam"/><br /><sub><b>Tycho Bokdam</b></sub></a><br /><a href="#ideas-TriPSs" title="Ideas, Planning, & Feedback">🤔</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/nicolashzmor"><img src="https://avatars.githubusercontent.com/u/66749276?v=4?s=60" width="60px;" alt="nicolashzmor"/><br /><sub><b>nicolashzmor</b></sub></a><br /><a href="https://github.com/jscutlery/semver/issues?q=author%3Anicolashzmor" title="Bug reports">🐛</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://medium.com/@rjlopezdev"><img src="https://avatars.githubusercontent.com/u/18118062?v=4?s=60" width="60px;" alt="Raúl Julián López Caña"/><br /><sub><b>Raúl Julián López Caña</b></sub></a><br /><a href="https://github.com/jscutlery/semver/issues?q=author%3Arjlopezdev" title="Bug reports">🐛</a> <a href="https://github.com/jscutlery/semver/commits?author=rjlopezdev" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/kaoz70"><img src="https://avatars.githubusercontent.com/u/79406?v=4?s=60" width="60px;" alt="Miguel Suarez"/><br /><sub><b>Miguel Suarez</b></sub></a><br /><a href="https://github.com/jscutlery/semver/commits?author=kaoz70" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://medium.com/@cakeinpanic/latest"><img src="https://avatars.githubusercontent.com/u/588916?v=4?s=60" width="60px;" alt="Katya Pavlenko"/><br /><sub><b>Katya Pavlenko</b></sub></a><br /><a href="https://github.com/jscutlery/semver/issues?q=author%3Acakeinpanic" title="Bug reports">🐛</a> <a href="https://github.com/jscutlery/semver/commits?author=cakeinpanic" title="Code">💻</a> <a href="#ideas-cakeinpanic" title="Ideas, Planning, & Feedback">🤔</a></td>
    </tr>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/hoonoh"><img src="https://avatars.githubusercontent.com/u/2078254?v=4?s=60" width="60px;" alt="Hoon Oh"/><br /><sub><b>Hoon Oh</b></sub></a><br /><a href="https://github.com/jscutlery/semver/commits?author=hoonoh" title="Code">💻</a> <a href="#ideas-hoonoh" title="Ideas, Planning, & Feedback">🤔</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/kurtinatlanta"><img src="https://avatars.githubusercontent.com/u/203931?v=4?s=60" width="60px;" alt="Kurt Hoyt"/><br /><sub><b>Kurt Hoyt</b></sub></a><br /><a href="https://github.com/jscutlery/semver/issues?q=author%3Akurtinatlanta" title="Bug reports">🐛</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/riain0"><img src="https://avatars.githubusercontent.com/u/6255097?v=4?s=60" width="60px;" alt="Riain Condon"/><br /><sub><b>Riain Condon</b></sub></a><br /><a href="https://github.com/jscutlery/semver/commits?author=riain0" title="Code">💻</a> <a href="https://github.com/jscutlery/semver/commits?author=riain0" title="Documentation">📖</a> <a href="#example-riain0" title="Examples">💡</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/lukelukes"><img src="https://avatars.githubusercontent.com/u/45536418?v=4?s=60" width="60px;" alt="lukelukes"/><br /><sub><b>lukelukes</b></sub></a><br /><a href="https://github.com/jscutlery/semver/issues?q=author%3Alukelukes" title="Bug reports">🐛</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/ianldgs"><img src="https://avatars.githubusercontent.com/u/6526498?v=4?s=60" width="60px;" alt="Ian Luca"/><br /><sub><b>Ian Luca</b></sub></a><br /><a href="https://github.com/jscutlery/semver/commits?author=ianldgs" title="Code">💻</a> <a href="#ideas-ianldgs" title="Ideas, Planning, & Feedback">🤔</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://www.tngtech.com/"><img src="https://avatars.githubusercontent.com/u/30828990?v=4?s=60" width="60px;" alt="Matthias Stemmler"/><br /><sub><b>Matthias Stemmler</b></sub></a><br /><a href="https://github.com/jscutlery/semver/issues?q=author%3Ams-tng" title="Bug reports">🐛</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/gioragutt"><img src="https://avatars.githubusercontent.com/u/13711224?v=4?s=60" width="60px;" alt="Giora Guttsait"/><br /><sub><b>Giora Guttsait</b></sub></a><br /><a href="https://github.com/jscutlery/semver/issues?q=author%3Agioragutt" title="Bug reports">🐛</a></td>
    </tr>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/dereekb"><img src="https://avatars.githubusercontent.com/u/3586580?v=4?s=60" width="60px;" alt="Derek Burgman"/><br /><sub><b>Derek Burgman</b></sub></a><br /><a href="https://github.com/jscutlery/semver/issues?q=author%3Adereekb" title="Bug reports">🐛</a> <a href="https://github.com/jscutlery/semver/commits?author=dereekb" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/Zamiell"><img src="https://avatars.githubusercontent.com/u/5511220?v=4?s=60" width="60px;" alt="James"/><br /><sub><b>James</b></sub></a><br /><a href="https://github.com/jscutlery/semver/issues?q=author%3AZamiell" title="Bug reports">🐛</a> <a href="https://github.com/jscutlery/semver/commits?author=Zamiell" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/ndrsg"><img src="https://avatars.githubusercontent.com/u/26137827?v=4?s=60" width="60px;" alt="ndrsg"/><br /><sub><b>ndrsg</b></sub></a><br /><a href="https://github.com/jscutlery/semver/commits?author=ndrsg" title="Code">💻</a> <a href="#ideas-ndrsg" title="Ideas, Planning, & Feedback">🤔</a> <a href="https://github.com/jscutlery/semver/issues?q=author%3Andrsg" title="Bug reports">🐛</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/fabsrc"><img src="https://avatars.githubusercontent.com/u/8853782?v=4?s=60" width="60px;" alt="Fabian Schneider"/><br /><sub><b>Fabian Schneider</b></sub></a><br /><a href="https://github.com/jscutlery/semver/issues?q=author%3Afabsrc" title="Bug reports">🐛</a> <a href="https://github.com/jscutlery/semver/commits?author=fabsrc" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/jdawber"><img src="https://avatars.githubusercontent.com/u/4291318?v=4?s=60" width="60px;" alt="JD"/><br /><sub><b>JD</b></sub></a><br /><a href="https://github.com/jscutlery/semver/commits?author=jdawber" title="Documentation">📖</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/nowseemee"><img src="https://avatars.githubusercontent.com/u/4532334?v=4?s=60" width="60px;" alt="Daniel Beck"/><br /><sub><b>Daniel Beck</b></sub></a><br /><a href="https://github.com/jscutlery/semver/commits?author=nowseemee" title="Code">💻</a> <a href="https://github.com/jscutlery/semver/commits?author=nowseemee" title="Documentation">📖</a></td>
      <td align="center" valign="top" width="14.28%"><a href="http://www.linkedin.com/in/florianguitton/en"><img src="https://avatars.githubusercontent.com/u/2495155?v=4?s=60" width="60px;" alt="Florian Guitton"/><br /><sub><b>Florian Guitton</b></sub></a><br /><a href="https://github.com/jscutlery/semver/commits?author=fguitton" title="Code">💻</a></td>
    </tr>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://mauris.github.io/"><img src="https://avatars.githubusercontent.com/u/996939?v=4?s=60" width="60px;" alt="Sam Yong"/><br /><sub><b>Sam Yong</b></sub></a><br /><a href="https://github.com/jscutlery/semver/issues?q=author%3Amauris" title="Bug reports">🐛</a> <a href="https://github.com/jscutlery/semver/commits?author=mauris" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/jamime"><img src="https://avatars.githubusercontent.com/u/2328042?v=4?s=60" width="60px;" alt="Jamie Thompson"/><br /><sub><b>Jamie Thompson</b></sub></a><br /><a href="https://github.com/jscutlery/semver/issues?q=author%3Ajamime" title="Bug reports">🐛</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://www.berger-engineering.io/"><img src="https://avatars.githubusercontent.com/u/29756792?v=4?s=60" width="60px;" alt="Michael Be"/><br /><sub><b>Michael Be</b></sub></a><br /><a href="https://github.com/jscutlery/semver/commits?author=mikelgo" title="Documentation">📖</a></td>
    </tr>
  </tbody>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

# License

This project is MIT licensed.
