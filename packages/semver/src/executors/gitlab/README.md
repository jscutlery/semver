## @jscutlery/semver:gitlab

An executor for creating GitLab Releases.

### Requirements

This executor requires the [GitLab Release CLI](https://gitlab.com/gitlab-org/release-cli/) to be installed on your machine.

### Usage

#### Run manually

Publish the `v1.0.0` release:

```
nx run my-project:gitlab --tag_name v1.0.0 [...options]
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
        "tag_name": "${tag}",
        "description": "A description"
      }
    }
  }
}
```