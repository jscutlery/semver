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

Using Nx:

```sh
npm install -D @jscutlery/semver
nx g @jscutlery/semver:install
```

Using Angular CLI:

```sh
ng add @jscutlery/semver
```

This package allows you to manage your monorepo using one of two modes: Synced or Independent.

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

You can leverage the built-in affected command to only version changed packages:

```
nx affected --target version [...options]
```

#### Synced mode

Release multiple projects at once:

```
nx run workspace:version [...options]
```

#### When run, this executor does the following:

1. Retrieve the current version of affected projects.
2. Bump versions based on your commits.
3. Generates CHANGELOGs based on your commits (uses [conventional-changelog-angular](https://github.com/conventional-changelog/conventional-changelog/tree/master/packages/conventional-changelog-angular) under the hood).
4. Creates a new commit including your `package.json` files and updated CHANGELOGs.
5. Creates new tags with the new versions number.
6. Push the releases (if enabled).
7. Run post-targets.

#### Available options:

| name                         | type       | default    | description                                          |
| ---------------------------- | ---------- | ---------- | ---------------------------------------------------- |
| **`--dryRun`**               | `bool`     | `false`    | run with dry mode                                    |
| **`--noVerify`**             | `bool`     | `false`    | skip git hooks                                       |
| **`--push`**                 | `bool`     | `false`    | push the release against git origin                  |
| **`--syncVersions`**         | `bool`     | `false`    | lock/sync versions between projects                  |
| **`--skipRootChangelog`**    | `bool`     | `false`    | skip generating root changelog _(sync mode only)_    |
| **`--skipProjectChangelog`** | `bool`     | `false`    | skip generating project changelog _(sync mode only)_ |
| **`--changelogHeader`**      | `string`   | `null`     | custom Markdown header for changelogs                |
| **`--origin`**               | `string`   | `'origin'` | push against git remote repository                   |
| **`--baseBranch`**           | `string`   | `'main'`   | push against git base branch                         |
| **`--releaseAs`**            | `string`   | `null`     | specify the level of change                          |
| **`--preid`**                | `string`   | `null`     | prerelease identifier                                |
| **`--versionTagPrefix`**     | `string`   | `null`     | specify the tag prefix                               |
| **`--postTargets`**          | `string[]` | `[]`       | specify a list of target to execute post-release     |
| **`--trackDeps`**              | `boolean`| `false`    | use dependencies when calculating a version bump     |

#### Configuration using the file

Note that you can define the options you want to customize using the `workspace.json` file, eg:

```json
{
  "executor": "@jscutlery/semver:version",
  "options": {
    "baseBranch": "master",
    "versionTagPrefix": "${target}@"
  }
}
```

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

#### Tag prefix customization

The **`--versionTagPrefix`** option allows you to customize the tag prefix.

With the sync mode the tag prefix is set to `"v"` by default, which is resolved to `v0.0.1` for example. Note that only one tag is created for the whole workspace.

With independent mode the tag prefix uses the context target value, the default value is `"${target}-"` which is resolved to `my-project-0.0.1` for example. Note that each project in the workspace is versioned with its own tag.

#### Post-targets

The **`--postTargets`** option allows you to run targets post-release. This is particularly handful for publishing packages on a registry or scheduling any other task. 

Here is a configuration example using `@jscutlery/semver:github` to create GitHub Release for _my-project_ library:

```json
{
  "targets": {
    "version": {
      "executor": "@jscutlery/semver:version",
      "options": {
        "postTargets": ["my-project:github"]
      }
    },
    "github": {
      "executor": "@jscutlery/semver:github",
      "options": {
        "tag": "${tag}",
        "notesFile": "libs/my-project/CHANGELOG.md"
      }
    }
  }
}
```

The `postTargets` option declare `my-project:github` target which run `@jscutlery/semver:github` executor. Note that options using the interpolation notation `${variable}` are resolved with their corresponding value.

#### Resolved options:

- `project`
- `version`
- `tag`
- `tagPrefix`
- `noVerify`
- `dryRun`
- `remote`
- `baseBranch`

#### Built-in post-targets:

- [`@jscutlery/semver:github`](https://github.com/jscutlery/semver/blob/main/packages/semver/src/executors/github/README.md) GiHub Release Support

#### Tracking dependencies:

The **`--trackDeps`** option indicates that direct dependencies in the project's dependency graph should be taken into account when incrementing the
version. If no version-incrementing changes are present in the project, but are present in one or more dependencies, then the project will receive a `patch`
version increment.

If you wish to track changes at any depth of your dependency graph, then you should do the following:

1. Enable versioning for each project in the dependency graph
2. Set the `trackDeps` option to `true` on each of the projects
3. Call the `version` executor with `--withDeps`

This setup will cause a cascade of version increments starting at the deepest changed dependency, then continuing up the graph until the indicated
project is reached. Additionally, if used in conjunction with `nx run-many --all`, or _affected_, then it will avoid attempting to version dependencies
multiple times.

### CI/CD usage

#### GitHub Actions

Here is an example running semver in a GitHub workflow:

```yml
name: default

on:
  push:
    branches:
      - 'master'

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
        with:
          fetch-depth: 0
      - name: git config
        run: |
          git config user.name "${GITHUB_ACTOR}"
          git config user.email "${GITHUB_ACTOR}@users.noreply.github.com"
      - run: yarn install --frozen-lockfile
      - run: yarn nx version my-project --push --baseBranch master
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

You can found the complete example [here](https://github.com/edbzn/semver-ci).

## Changelog

For new features or breaking changes [see the changelog](https://github.com/jscutlery/semver/blob/main/packages/semver/CHANGELOG.md).

## Contributors

This project follows the [all-contributors](https://github.com/all-contributors/all-contributors) specification.

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tr>
    <td align="center"><a href="https://marmicode.io/"><img src="https://avatars2.githubusercontent.com/u/2674658?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Younes Jaaidi</b></sub></a><br /><a href="https://github.com/jscutlery/semver/issues?q=author%3Ayjaaidi" title="Bug reports">🐛</a> <a href="https://github.com/jscutlery/semver/commits?author=yjaaidi" title="Code">💻</a> <a href="https://github.com/jscutlery/semver/commits?author=yjaaidi" title="Documentation">📖</a> <a href="#example-yjaaidi" title="Examples">💡</a> <a href="#ideas-yjaaidi" title="Ideas, Planning, & Feedback">🤔</a></td>
    <td align="center"><a href="https://www.codamit.dev/"><img src="https://avatars0.githubusercontent.com/u/8522558?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Edouard Bozon</b></sub></a><br /><a href="https://github.com/jscutlery/semver/issues?q=author%3Aedbzn" title="Bug reports">🐛</a> <a href="https://github.com/jscutlery/semver/commits?author=edbzn" title="Code">💻</a> <a href="https://github.com/jscutlery/semver/commits?author=edbzn" title="Documentation">📖</a> <a href="#example-edbzn" title="Examples">💡</a> <a href="#ideas-edbzn" title="Ideas, Planning, & Feedback">🤔</a></td>
    <td align="center"><a href="http://betaagency.ru/"><img src="https://avatars.githubusercontent.com/u/1610882?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Gleb Mikheev</b></sub></a><br /><a href="#ideas-glebmachine" title="Ideas, Planning, & Feedback">🤔</a></td>
    <td align="center"><a href="http://chigix.com/"><img src="https://avatars.githubusercontent.com/u/2692787?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Richard Lea</b></sub></a><br /><a href="https://github.com/jscutlery/semver/commits?author=chigix" title="Code">💻</a></td>
    <td align="center"><a href="https://github.com/Katona"><img src="https://avatars.githubusercontent.com/u/1146931?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Katona</b></sub></a><br /><a href="https://github.com/jscutlery/semver/issues?q=author%3AKatona" title="Bug reports">🐛</a> <a href="https://github.com/jscutlery/semver/commits?author=Katona" title="Code">💻</a></td>
    <td align="center"><a href="https://github.com/ntziolis"><img src="https://avatars.githubusercontent.com/u/265338?v=4?s=100" width="100px;" alt=""/><br /><sub><b>ntziolis</b></sub></a><br /><a href="https://github.com/jscutlery/semver/issues?q=author%3Antziolis" title="Bug reports">🐛</a></td>
    <td align="center"><a href="https://github.com/RicardoJBarrios"><img src="https://avatars.githubusercontent.com/u/14352238?v=4?s=100" width="100px;" alt=""/><br /><sub><b>RicardoJBarrios</b></sub></a><br /><a href="https://github.com/jscutlery/semver/commits?author=RicardoJBarrios" title="Code">💻</a> <a href="#ideas-RicardoJBarrios" title="Ideas, Planning, & Feedback">🤔</a></td>
  </tr>
  <tr>
    <td align="center"><a href="https://github.com/sylvainar"><img src="https://avatars.githubusercontent.com/u/9823286?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Sylvain Arnouts</b></sub></a><br /><a href="https://github.com/jscutlery/semver/issues?q=author%3Asylvainar" title="Bug reports">🐛</a></td>
    <td align="center"><a href="https://github.com/GethsLeader"><img src="https://avatars.githubusercontent.com/u/7333062?v=4?s=100" width="100px;" alt=""/><br /><sub><b>GethsLeader</b></sub></a><br /><a href="https://github.com/jscutlery/semver/commits?author=GethsLeader" title="Code">💻</a> <a href="#ideas-GethsLeader" title="Ideas, Planning, & Feedback">🤔</a></td>
    <td align="center"><a href="https://github.com/shaharkazaz"><img src="https://avatars.githubusercontent.com/u/17194830?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Shahar Kazaz</b></sub></a><br /><a href="https://github.com/jscutlery/semver/commits?author=shaharkazaz" title="Code">💻</a></td>
    <td align="center"><a href="https://github.com/miluoshi"><img src="https://avatars.githubusercontent.com/u/1130547?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Miloš Lajtman</b></sub></a><br /><a href="https://github.com/jscutlery/semver/issues?q=author%3Amiluoshi" title="Bug reports">🐛</a> <a href="https://github.com/jscutlery/semver/commits?author=miluoshi" title="Code">💻</a></td>
    <td align="center"><a href="https://github.com/hcharley"><img src="https://avatars.githubusercontent.com/u/1542740?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Charley Bodkin</b></sub></a><br /><a href="https://github.com/jscutlery/semver/issues?q=author%3Ahcharley" title="Bug reports">🐛</a></td>
    <td align="center"><a href="https://jefiozie.github.io/"><img src="https://avatars.githubusercontent.com/u/17835373?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Jeffrey Bosch</b></sub></a><br /><a href="https://github.com/jscutlery/semver/commits?author=Jefiozie" title="Code">💻</a></td>
    <td align="center"><a href="https://github.com/RaviTejaVattem"><img src="https://avatars.githubusercontent.com/u/43704759?v=4?s=100" width="100px;" alt=""/><br /><sub><b>RaviTejaVattem</b></sub></a><br /><a href="https://github.com/jscutlery/semver/commits?author=RaviTejaVattem" title="Code">💻</a></td>
  </tr>
  <tr>
    <td align="center"><a href="https://abishek.is-a.dev/"><img src="https://avatars.githubusercontent.com/u/43115551?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Abishek PY</b></sub></a><br /><a href="https://github.com/jscutlery/semver/commits?author=vj-abishek" title="Code">💻</a> <a href="https://github.com/jscutlery/semver/commits?author=vj-abishek" title="Documentation">📖</a></td>
    <td align="center"><a href="https://github.com/hinogi"><img src="https://avatars.githubusercontent.com/u/4602609?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Stefan Schneider</b></sub></a><br /><a href="https://github.com/jscutlery/semver/commits?author=hinogi" title="Code">💻</a></td>
  </tr>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

# License

This project is MIT licensed.
