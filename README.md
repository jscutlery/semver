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

Without Angular:

```sh
npm install -D @jscutlery/semver
nx g @jscutlery/semver:install
```

or if you are using Angular:

```sh
ng add @jscutlery/semver
```

This package allows you to manage your monorepo using one of two modes: Synced or Independent.

#### Independent mode (default)

Allow multiple projects to be versioned independently. This way you release only what you want and consumers don't get updates they don't need. This allows small, rapid and incremental adoption of your packages.

#### Synced mode

Allow multiple projects to be versioned in a synced/locked mode. Use this if you want to automatically tie all package versions together. This mode is useful when you are working with only one product.

> One issue with this approach is that a major change in any project will result in all projects having a new major version.

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

#### Specified Level Change

Release a project with a version that is incremented by a specified level.
Level can be one of: `major`, `minor`, `patch`, `premajor`, `preminor`, `prepatch`, or `prerelease`:

```
nx run workspace:version --version=major
nx run workspace:version --version=minor
nx run workspace:version --version=patch
nx run workspace:version --version=prerelease --preid=alpha
nx run workspace:version --version=prerelease --preid=beta
```

#### When run, this command does the following:

1. Retrieve the current version of affected `package.json` projects.
2. Bump versions based on your commits.
3. Generates CHANGELOGs based on your commits (uses [conventional-changelog-angular](https://github.com/conventional-changelog/conventional-changelog/tree/master/packages/conventional-changelog-angular) under the hood).
4. Creates a new commit including your `package.json` files and updated CHANGELOGs.
5. Creates new tags with the new versions number.
6. Push the releases (if enabled).

#### Available options:

| name                           | type      | default    | description                                                                 |
| ------------------------------ | --------- | ---------- | --------------------------------------------------------------------------- |
| **`--dry-run`**                | `boolean` | `false`    | run with dry mode                                                           |
| **`--no-verify`**              | `boolean` | `false`    | skip git hooks                                                              |
| **`--push`**                   | `boolean` | `false`    | push the release                                                            |
| **`--sync-versions`**          | `boolean` | `false`    | lock/sync versions between projects                                         |
| **`--skip-root-changelog`**    | `boolean` | `false`    | skip generating root CHANGELOG containing all changes (only with sync mode) |
| **`--skip-project-changelog`** | `boolean` | `false`    | skip generating project CHANGELOG (only with sync mode)                     |
| **`--origin`**                 | `string`  | `'origin'` | push against git remote repository                                          |
| **`--base-branch`**            | `string`  | `'main'`   | push against git base branch                                                |
| **`--version`**                | `string`  | `null`     | specify the level of change                                                 |
| **`--preid`**                  | `string`  | `null`     | prerelease identifier                                                       |

## Changelog

For new features or breaking changes [see the changelog](https://github.com/jscutlery/nx-plugin-semver/blob/main/packages/semver/CHANGELOG.md).

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
  </tr>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

# License

This project is MIT licensed.
