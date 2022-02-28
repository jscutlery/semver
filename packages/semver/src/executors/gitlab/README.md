## @jscutlery/semver:gitlab

An executor for creating GitLab Releases.

### Requirements

This executor requires the [GitLab Release CLI](https://gitlab.com/gitlab-org/release-cli/) to be installed on your machine.

### Usage

#### Run manually

Publish the `v1.0.0` release:

```
nx run my-project:gitlab --tag v1.0.0 [...options]
```

#### Configuration using post-targets (recommended)

This executor aims to be used with [post-targets](https://github.com/jscutlery/semver#post-targets):

```json
{
  "targets": {
    "version": {
      "executor": "@jscutlery/semver:version",
      "options": {
        "postTargets": ["my-project:gitlab"]
      }
    },
    "github": {
      "executor": "@jscutlery/semver:gitlab",
      "options": {
        "tag": "${tag}",
        "description": "${notes}"
      }
    }
  }
}
```

#### Available Options

| name                  | type       | default          | description                                                  |
| --------------------- | ---------- | ---------------- | ------------------------------------------------------------ |
| **`--tag`**           | `string`   | `$CI_COMMIT_TAG` | attach the release to the specified tag                      |
| **`--name`**          | `string`   | `undefined`      | name of the release                                          |
| **`--assets`**        | `string[]` | `undefined`      | a list of assets to attach new release                       |
| **`--description`**   | `string`   | `undefined`      | release notes                                                |
| **`--releasedAt`**    | `string`   | `undefined`      | timestamp which the release will happen/has happened         |
| **`--ref`**           | `boolean`  | `$CI_COMMIT_SHA` | commit SHA, another tag name, or a branch name               |
| **`--milestones`**    | `string[]` | `undefined`      | list of milestones to associate the release with             |
