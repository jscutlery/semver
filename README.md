<a href="https://www.npmjs.com/package/@jscutlery/semver" rel="nofollow">
  <img src="https://badgen.net/npm/v/@jscutlery/semver">
</a>

# @jscutlery/semver

**Nx plugin for versioning** using [SemVer](https://semver.org/) and **CHANGELOG generation** powered by [Conventional Commits](https://conventionalcommits.org).

## Setup

### Install

```
nx add @jscutlery/semver
```

This package allows you to manage your monorepo using one of two modes: Synced or Independent.

#### Independent mode (default)

Allow multiple projects to be versioned independently. This way you release only what you want and consumers don't get updates they don't need. This allows small, rapid and incremental adoption of your packages.

#### Synced mode

Allow multiple projects to be versioned in a synced/locked mode. Use this if you want to automatically tie all package versions together.

> One issue with this approach is that a major change in any project will result in all projects having a new major version.

This mode is useful when you are working with one product.

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

#### When run, this command does the following:

1. Retrieve the current version(s) of affected `package.json` file(s).
2. Bump the version based on your commits.
3. Generates a changelog based on your commits (uses [conventional-changelog-angular](https://github.com/conventional-changelog/conventional-changelog/tree/master/packages/conventional-changelog-angular) under the hood).
4. Creates a new `commit` including your package.json file and updated CHANGELOG.
5. Creates a new `tag` with the new version number.
6. Push the release if enabled.

#### Available options:

| name                  | type       | default    | description                         |
| --------------------- | ---------- | ---------- | ----------------------------------- |
| **`--dry-run`**       | `boolean`  | `false`    | run with dry mode                   |
| **`--no-verify`**     | `boolean`  | `false`    | skip git hooks                      |
| **`--first-release`** | `boolean`  | `false`    | generate the CHANGELOG file         |
| **`--push`**          | `boolean`  | `false`    | push the release                    |
| **`--origin`**        | `string`   | `'origin'` | push against git remote repository  |
| **`--base-branch`**   | `string`   | `'main'`   | push against git base branch        |
| **`--sync-versions`** | `boolean`  | `false`    | lock/sync versions between projects |
| **`--projects`**      | `string[]` | `[]`       | version projects independently      |


## Changelog

For new features or breaking changes [see the changelog](https://github.com/jscutlery/nx-plugin-semver/blob/main/packages/semver/CHANGELOG.md).

## Contributors

This project follows the [all-contributors](https://github.com/all-contributors/all-contributors) specification.

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tr>
    <td align="center"><a href="https://marmicode.io/"><img src="https://avatars2.githubusercontent.com/u/2674658?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Younes Jaaidi</b></sub></a><br /><a href="https://github.com/jscutlery/convoyr/issues?q=author%3Ayjaaidi" title="Bug reports">🐛</a> <a href="https://github.com/jscutlery/convoyr/commits?author=yjaaidi" title="Code">💻</a> <a href="https://github.com/jscutlery/convoyr/commits?author=yjaaidi" title="Documentation">📖</a> <a href="#example-yjaaidi" title="Examples">💡</a> <a href="#ideas-yjaaidi" title="Ideas, Planning, & Feedback">🤔</a></td>
    <td align="center"><a href="https://www.codamit.dev/"><img src="https://avatars0.githubusercontent.com/u/8522558?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Edouard Bozon</b></sub></a><br /><a href="https://github.com/jscutlery/convoyr/issues?q=author%3Aedbzn" title="Bug reports">🐛</a> <a href="https://github.com/jscutlery/convoyr/commits?author=edbzn" title="Code">💻</a> <a href="https://github.com/jscutlery/convoyr/commits?author=edbzn" title="Documentation">📖</a> <a href="#example-edbzn" title="Examples">💡</a> <a href="#ideas-edbzn" title="Ideas, Planning, & Feedback">🤔</a></td>
  </tr>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

# License

This project is MIT licensed.
