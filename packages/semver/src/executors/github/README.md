## @jscutlery/semver:github

An executor for creating GitHub Releases.

### Requirements

This executor requires the [GitHub CLI](https://cli.github.com/manual/installation) to be installed on your machine.

### Usage

#### Configuration

In the workspace definition:

```json
{
  "targets": {
    "github": {
      "executor": "@jscutlery/semver:github",
      "options": {
        "notesFile": "libs/my-project/CHANGELOG.md"
      }
    }
  }
}
```

#### Run manually

Publish the `v1.0.0` release:

```
nx run my-project:github --tag v1.0.0 --notesFile "libs/my-project/CHANGELOG.md" [...options]
```

#### Run using post-targets (recommended)

This executor aims to be used with [post-targets](https://github.com/jscutlery/semver#post-targets):

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

##### Only new notes

Rather than using the entire changelog on every release as your notes you can use the `notes`
context provided by `@jscutlery/semver:version` to only include the new changes

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
        "notes": "${notes}"
      }
    }
  }
}
```

#### Available Options

| name                        | type       | default     | description                                                     |
| --------------------------- | ---------- | ----------- | --------------------------------------------------------------- |
| **`--tag`**                 | `string`   | `undefined` | attach the release to the specified tag                         |
| **`--branch`**              | `string`   | `main`      | target branch or full commit SHA (default: main branch)         |
| **`--files`**               | `string[]` | `undefined` | a list of asset files may be given to upload to the new release |
| **`--notes`**               | `string`   | `undefined` | release notes                                                   |
| **`--notesFile`**           | `string`   | `undefined` | read release notes from file                                    |
| **`--draft`**               | `boolean`  | `undefined` | save the release as a draft instead of publishing               |
| **`--title`**               | `string`   | `undefined` | release title                                                   |
| **`--prerelease`**          | `boolean`  | `undefined` | mark the release as a prerelease                                |
| **`--discussion-category`** | `string`   | `undefined` | start a discussion of the specified category                    |
| **`--repo`**                | `string`   | `undefined` | select another repository using the [HOST/]OWNER/REPO format    |

#### CI/CD


To make this executor work in your GitHub workflows you should provide the `GITHUB_TOKEN` environment variable.

```yml
- name: Version
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
  run: npx nx affected --target=version
```
