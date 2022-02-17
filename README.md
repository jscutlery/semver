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
nx run workspace:version [....options]
```

#### When run, this executor does the following

1. Retrieve the current version of affected projects.
2. Bump versions based on your commits.
3. Generates CHANGELOGs based on your commits (uses [conventional-changelog-angular](https://github.com/conventional-changelog/conventional-changelog/tree/master/packages/conventional-changelog-angular) under the hood).
4. Creates a new commit including your `package.json` files and updated CHANGELOGs.
5. Creates new tags with the new versions number.
6. Push the releases (if enabled).
7. Run post-targets.

#### Available options

| name                         | type       | default     | description                                      |
| ---------------------------- | ---------- | ----------- | ------------------------------------------------ |
| **`--dryRun`**               | `boolean`  | `false`     | run with dry mode                                |
| **`--noVerify`**             | `boolean`  | `false`     | skip git hooks                                   |
| **`--push`**                 | `boolean`  | `false`     | push the release against git origin              |
| **`--syncVersions`**         | `boolean`  | `false`     | lock/sync versions between projects              |
| **`--skipRootChangelog`**    | `boolean`  | `false`     | skip generating root changelog                   |
| **`--skipProjectChangelog`** | `boolean`  | `false`     | skip generating project changelog                |
| **`--origin`**               | `string`   | `'origin'`  | push against git remote repository               |
| **`--baseBranch`**           | `string`   | `'main'`    | push against git base branch                     |
| **`--changelogHeader`**      | `string`   | `undefined` | custom Markdown header for changelogs            |
| **`--releaseAs`**            | `string`   | `undefined` | specify the level of change                      |
| **`--preid`**                | `string`   | `undefined` | prerelease identifier                            |
| **`--tagPrefix`**            | `string`   | `undefined` | specify the tag prefix                           |
| **`--postTargets`**          | `string[]` | `[]`        | specify a list of target to execute post-release |
| **`--trackDeps`**            | `boolean`  | `false`     | use dependencies when calculating a version bump |
| **`--commitMessageFormat`**  | `string`   | `undefined` | format the auto-generated message commit         |

#### Configuration using the file

Note that you can define the options you want to customize using the `workspace.json` file, eg:

```json
{
  "executor": "@jscutlery/semver:version",
  "options": {
    "baseBranch": "master",
    "tagPrefix": "${target}@"
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

The **`--tagPrefix`** option allows you to customize the tag prefix.

With the sync mode the tag prefix is set to `"v"` by default, which is resolved to `v0.0.1` for example. Note that only one tag is created for the whole workspace.

With independent mode the tag prefix uses the context target value, the default value is `"${target}-"` which is resolved to `my-project-0.0.1` for example. Note that each project in the workspace is versioned with its own tag.

#### Commit message customization

The **`--commitMessageFormat`** option allows you to customize the commit message. By default, the commit message is formatted as the following:

```
chore(${projectName}): release version ${version}
```

The `version` variable is resolved to the current release version, for instance `1.0.1`. This option also allows you to interpolate the `projectName` variable:

```
release: bump ${projectName} to ${version} [skip ci]
```

Note that it's the right place to add common keywords to skip CI workflows, for example: `[skip ci]` for GitHub.

#### Triggering executors post-release

The **`--postTargets`** option allows you to run targets post-release. This is particularly handful for publishing packages on a registry or scheduling any other task.

Here is a configuration example using [`@jscutlery/semver:github`](https://github.com/jscutlery/semver/blob/main/packages/semver/src/executors/github/README.md) to create a GitHub Release and [`ngx-deploy-npm:deploy`](https://github.com/bikecoders/ngx-deploy-npm) to publish on NPM:

```json
{
  "targets": {
    "version": {
      "executor": "@jscutlery/semver:version",
      "options": {
        "postTargets": ["my-project:publish", "my-project:github"]
      }
    },
    "github": {
      "executor": "@jscutlery/semver:github",
      "options": {
        "tag": "${tag}",
        "notes": "${notes}"
      }
    },
    "publish": {
      "executor": "ngx-deploy-npm:deploy",
      "options": {
        "access": "public"
      }
    }
  }
}
```

Note that options using the interpolation notation `${variable}` are resolved with their corresponding value.

#### Resolved options

- `project`
- `version`
- `tag`
- `tagPrefix`
- `noVerify`
- `dryRun`
- `remote`
- `baseBranch`
- `notes`

#### Built-in post-targets

- [`@jscutlery/semver:github`](https://github.com/jscutlery/semver/blob/main/packages/semver/src/executors/github/README.md) GiHub Release Support

#### Tracking dependencies

The **`--trackDeps`** option indicates that direct dependencies in the project's dependency graph should be taken into account when incrementing the
version. If no version-incrementing changes are present in the project, but are present in one or more dependencies, then the project will receive a `patch`
version increment.

If you wish to track changes at any depth of your dependency graph, then you should do the following:

1. Enable versioning for each project in the dependency graph
2. Set the `trackDeps` option to `true` on each of the projects
3. Make sure that `version` is run on projects in the right order by configuring `version`'s target dependencies in `nx.json`:

```json
{
  "targetDependencies": {
    "version": [
      {
        "target": "version",
        "projects": "dependencies"
      }
    ]
  }
}
```

This setup will cause a cascade of version increments starting at the deepest changed dependency,
then continuing up the graph until the indicated project is reached.
Additionally, if used in conjunction with `nx run-many --all`, or `nx affected`,
then it will avoid attempting to version dependencies multiple times.

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
    <td align="center"><a href="https://github.com/CaffeinatedCodeMonkey"><img src="https://avatars.githubusercontent.com/u/5892586?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Travis Jones</b></sub></a><br /><a href="https://github.com/jscutlery/semver/commits?author=CaffeinatedCodeMonkey" title="Code">💻</a> <a href="https://github.com/jscutlery/semver/commits?author=CaffeinatedCodeMonkey" title="Documentation">📖</a> <a href="#ideas-CaffeinatedCodeMonkey" title="Ideas, Planning, & Feedback">🤔</a></td>
    <td align="center"><a href="https://github.com/HassenHichri"><img src="https://avatars.githubusercontent.com/u/10193983?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Hichri Hassen</b></sub></a><br /><a href="https://github.com/jscutlery/semver/issues?q=author%3AHassenHichri" title="Bug reports">🐛</a></td>
    <td align="center"><a href="https://github.com/GarethDJohn"><img src="https://avatars.githubusercontent.com/u/28591718?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Gareth John</b></sub></a><br /><a href="https://github.com/jscutlery/semver/commits?author=GarethDJohn" title="Code">💻</a></td>
    <td align="center"><a href="https://github.com/dianjuar"><img src="https://avatars.githubusercontent.com/u/7026066?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Diego Juliao</b></sub></a><br /><a href="https://github.com/jscutlery/semver/issues?q=author%3Adianjuar" title="Bug reports">🐛</a> <a href="https://github.com/jscutlery/semver/commits?author=dianjuar" title="Code">💻</a> <a href="#ideas-dianjuar" title="Ideas, Planning, & Feedback">🤔</a></td>
    <td align="center"><a href="https://github.com/ChazUK"><img src="https://avatars.githubusercontent.com/u/768108?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Charlie Francis</b></sub></a><br /><a href="https://github.com/jscutlery/semver/issues?q=author%3AChazUK" title="Bug reports">🐛</a></td>
  </tr>
  <tr>
    <td align="center"><a href="https://github.com/hpierre74"><img src="https://avatars.githubusercontent.com/u/25172711?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Pierre Huyghe</b></sub></a><br /><a href="https://github.com/jscutlery/semver/commits?author=hpierre74" title="Code">💻</a></td>
    <td align="center"><a href="https://gitlab.com/wsedlacek"><img src="https://avatars.githubusercontent.com/u/8206108?v=4?s=100" width="100px;" alt=""/><br /><sub><b>William Sedlacek</b></sub></a><br /><a href="https://github.com/jscutlery/semver/commits?author=wSedlacek" title="Code">💻</a> <a href="#ideas-wSedlacek" title="Ideas, Planning, & Feedback">🤔</a></td>
    <td align="center"><a href="https://palmtreecoding.com/"><img src="https://avatars.githubusercontent.com/u/7668692?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Tycho Bokdam</b></sub></a><br /><a href="#ideas-TriPSs" title="Ideas, Planning, & Feedback">🤔</a></td>
    <td align="center"><a href="https://github.com/nicolashzmor"><img src="https://avatars.githubusercontent.com/u/66749276?v=4?s=100" width="100px;" alt=""/><br /><sub><b>nicolashzmor</b></sub></a><br /><a href="https://github.com/jscutlery/semver/issues?q=author%3Anicolashzmor" title="Bug reports">🐛</a></td>
    <td align="center"><a href="https://medium.com/@rjlopezdev"><img src="https://avatars.githubusercontent.com/u/18118062?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Raúl Julián López Caña</b></sub></a><br /><a href="https://github.com/jscutlery/semver/issues?q=author%3Arjlopezdev" title="Bug reports">🐛</a> <a href="https://github.com/jscutlery/semver/commits?author=rjlopezdev" title="Code">💻</a></td>
    <td align="center"><a href="https://github.com/kaoz70"><img src="https://avatars.githubusercontent.com/u/79406?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Miguel Suarez</b></sub></a><br /><a href="https://github.com/jscutlery/semver/commits?author=kaoz70" title="Code">💻</a></td>
    <td align="center"><a href="https://medium.com/@cakeinpanic/latest"><img src="https://avatars.githubusercontent.com/u/588916?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Katya Pavlenko</b></sub></a><br /><a href="https://github.com/jscutlery/semver/issues?q=author%3Acakeinpanic" title="Bug reports">🐛</a></td>
  </tr>
  <tr>
    <td align="center"><a href="https://github.com/hoonoh"><img src="https://avatars.githubusercontent.com/u/2078254?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Hoon Oh</b></sub></a><br /><a href="https://github.com/jscutlery/semver/commits?author=hoonoh" title="Code">💻</a> <a href="#ideas-hoonoh" title="Ideas, Planning, & Feedback">🤔</a></td>
  </tr>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

# License

This project is MIT licensed.
