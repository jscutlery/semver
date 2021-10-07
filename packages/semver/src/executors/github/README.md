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
        "files": ["./libs/my-project/CHANGELOG.md"]
      }
    }
  }
}
```

#### Run manually

Publish the `v.1.0.0` release:

```
nx run my-project:github --tag v1.0.0 [...options]
```

#### Run using post-targets (recommended)

This executor aims to be used with [post-targets](https://github.com/jscutlery/semver#post-targets). 

#### Available Options

| name           | type       | default     | description                                                     |
| -------------- | ---------- | ----------- | --------------------------------------------------------------- |
| **`--tag`**    | `string`   | `undefined` | attach the release to the specified tag                         |
| **`--branch`** | `string`   | `main`      | target branch or full commit SHA (default: main branch)         |
| **`--files`**  | `string[]` | `false`     | a list of asset files may be given to upload to the new release |
