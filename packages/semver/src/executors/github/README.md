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

Publish the `v.1.0.0` release:

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

#### Available Options

| name              | type       | default     | description                                                     |
| ----------------- | ---------- | ----------- | --------------------------------------------------------------- |
| **`--tag`**       | `string`   | `undefined` | attach the release to the specified tag                         |
| **`--branch`**    | `string`   | `main`      | target branch or full commit SHA (default: main branch)         |
| **`--files`**     | `string[]` | `undefined` | a list of asset files may be given to upload to the new release |
| **`--notes`**     | `string`   | `undefined` | release notes                                                   |
| **`--notesFile`** | `string`   | `undefined` | read release notes from file                                    |
