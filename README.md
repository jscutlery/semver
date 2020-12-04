<div align="center">
  <a href="https://www.npmjs.com/package/@jscutlery/semver" rel="nofollow">
    <img src="https://badgen.net/npm/v/@jscutlery/semver">
  </a>
</div>

# @jscutlery/semver

An Nx plugin for versioning using [semver](https://semver.org/) and CHANGELOG generation powered by [Conventional Commits](https://conventionalcommits.org).

## Setup

### 1. Install

```
yarn add @jscutlery/semver -D
```

### 2. Configure

Update your `angular.json` or `workspace.json` file and add:

```
{
  "my-package": {
    architect: {
      "version": {
        "builder": "@jscutlery/semver:version"
      }
    }
  } 
}
```

### 3. Release

```
nx run my-package:version [...options]
```

Retrieve the current version of package.json file.

Bump the version based on your commits.

Generates a changelog based on your commits (uses conventional-changelog under the hood).

Creates a new commit including your package.json file and updated CHANGELOG.

Creates a new tag with the new version number.

Available options : 

- **`--dry-run`** `boolean` Run with dry mode
- **`--no-verify`** `boolean` Skip git hooks
- **`--first-release`** `boolean` Generate the CHANGELOG file

## Changelog

For new features or breaking changes [see the changelog](CHANGELOG.md).

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
