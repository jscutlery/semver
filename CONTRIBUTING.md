# Contributing to @jscutlery/semver

Thank you for your contribution 🤗!

## Guidelines

- Commits follow the [Angular commit convention](https://github.com/angular/angular/blob/22b96b9/CONTRIBUTING.md#-commit-message-guidelines)
- Features and bug fixes should be covered by test cases
- Features should be documented in the README

## Building and testing the library

```sh
# install dependencies
pnpm install

# build the library
pnpm build

# run the tests
pnpm test
```

> Note that you need to build the library first to run the e2e tests.

## Using `npm link` or `pnpm link`

In order to use the library locally on another project, you can use the `pnpm link` feature.

1. Head to the built package and inform pnpm about it:

```sh
cd dist/packages/semver
pnpm link --global
```

2. Go to your project and link the package:

```sh
pnpm link --global @jscutlery/semver
```

If you want to try semver on an already existing workspace, you can clone the following repository [@yjaaidi/semver-sandbox](https://github.com/yjaaidi/semver-sandbox) and run the following command to reset the git history: `tools/reset.sh`.
