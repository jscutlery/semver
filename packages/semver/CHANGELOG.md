# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

# [1.0.0](https://github.com/jscutlery/semver/compare/semver-0.4.0...semver-1.0.0) (2021-01-04)


### Features

* ✅ add `-` separator after prefix ([c871d1f](https://github.com/jscutlery/semver/commit/c871d1f728a5f5a69723303e37a533841e202432))


### BREAKING CHANGES

* this will break the changelog without renaming the last tag as standard-version will not be able to find the last tag



# 0.4.0 (2021-01-04)


### Bug Fixes

* 🐞 add tag prefix in independent mode ([e690d37](https://github.com/jscutlery/nx-plugin-semver/commit/e690d3710fe1e463379cb61dc65a857b422fc504)), closes [#34](https://github.com/jscutlery/nx-plugin-semver/issues/34)
* 🐞 don't add workspace to nx.json with independent versions ([bbab0a7](https://github.com/jscutlery/nx-plugin-semver/commit/bbab0a76fbfd4fe421abb96e166a5d6408a41b81))
* **builder:** 🐞 add @angular-devkit/build-angular dependency ([ab5c208](https://github.com/jscutlery/nx-plugin-semver/commit/ab5c208e71e8bced7301a6b8c0bea7c7a5d17029))
* **builder:** 🐞 resolve workspace definition ([c4bf6b2](https://github.com/jscutlery/nx-plugin-semver/commit/c4bf6b239a2ea7bbd0279f31a78d68bb0782eba7))
* 🐞 builder schema and error handling ([99bb560](https://github.com/jscutlery/nx-plugin-semver/commit/99bb56058195c70d89f6c789cae5351df0b6118a))
* 🐞 do not push with --dry-run ([8b40a04](https://github.com/jscutlery/nx-plugin-semver/commit/8b40a048452ed9d6cb5cdc6816882133a5aa08cf))
* 🐞 normalize options ([248b75e](https://github.com/jscutlery/nx-plugin-semver/commit/248b75e86e31995d3bcb6f7349da7743f22093e8))


### Features

* **ng-add:** ✅ add --projects option override ([69851fb](https://github.com/jscutlery/nx-plugin-semver/commit/69851fb61084e08a35e0d648585b71ca4970023f)), closes [#36](https://github.com/jscutlery/nx-plugin-semver/issues/36)
* ✅ prompt user for syncing versions ([4de371a](https://github.com/jscutlery/nx-plugin-semver/commit/4de371a8d2d6d39d2436ec82f43b5af01c82b8ee))
* **ng-add:** ✅ add ng-add schematic ([2db99eb](https://github.com/jscutlery/nx-plugin-semver/commit/2db99eba9b3fbdf354fff2e95c89e6830f68be06))
* **ng-add:** ✅ add target if independent versions ([2be6140](https://github.com/jscutlery/nx-plugin-semver/commit/2be6140c620076e519c569b3a88970b47f47277a))
* **ng-add:** ✅ add workspace project if --sync-versions enabled ([bfa177f](https://github.com/jscutlery/nx-plugin-semver/commit/bfa177f0cd2d4159fbe38645561a6d807aaa78bb))
* **ng-add:** ✅ add workspace project to Nx config ([c4cf38f](https://github.com/jscutlery/nx-plugin-semver/commit/c4cf38f32cb3a6c37db915a2760259fe0bea3b26))
* **ng-add:** ✅ set independent versions by default ([95ff736](https://github.com/jscutlery/nx-plugin-semver/commit/95ff7364b5861c9cc9b83e37ebd2559f8f94561b))
* ✅ add --sync-versions option ([2fdf2c3](https://github.com/jscutlery/nx-plugin-semver/commit/2fdf2c3b0ff3288e18cdbd3a64b200ae45c05512)), closes [#5](https://github.com/jscutlery/nx-plugin-semver/issues/5)
* ✅ add `--push` option ([2dc9aa6](https://github.com/jscutlery/nx-plugin-semver/commit/2dc9aa6ee2cd90d2f1d5de14b32ff344fc303de0))
* ✅ add version builder ([30509e7](https://github.com/jscutlery/nx-plugin-semver/commit/30509e7153cb524060407b89fd6ef615a939254b))
* ✅ apply no-verify to push too ([b0f3c76](https://github.com/jscutlery/nx-plugin-semver/commit/b0f3c767986635812f81239fcad495e92e80eaea))
* ✅ fallback to angular.json if workspace.json is not found ([2b0ab57](https://github.com/jscutlery/nx-plugin-semver/commit/2b0ab57dc55f14af952b20f55b7a0f0dd6261b42))
* ✅ use angular preset ([67312bf](https://github.com/jscutlery/nx-plugin-semver/commit/67312bf19e24f8731c22be1944bf5bdb2aff65e4))



# [0.3.0](https://github.com/jscutlery/nx-plugin-semver/compare/v0.2.1...v0.3.0) (2020-12-31)


### Bug Fixes

* 🐞 add tag prefix in independent mode ([e690d37](https://github.com/jscutlery/nx-plugin-semver/commit/e690d3710fe1e463379cb61dc65a857b422fc504)), closes [#34](https://github.com/jscutlery/nx-plugin-semver/issues/34)


### Features

* ✅ prompt user for syncing versions ([4de371a](https://github.com/jscutlery/nx-plugin-semver/commit/4de371a8d2d6d39d2436ec82f43b5af01c82b8ee))



## [0.2.1](https://github.com/jscutlery/nx-plugin-semver/compare/v0.2.0...v0.2.1) (2020-12-28)


### Bug Fixes

* 🐞 don't add workspace to nx.json with independent versions ([bbab0a7](https://github.com/jscutlery/nx-plugin-semver/commit/bbab0a76fbfd4fe421abb96e166a5d6408a41b81))



# [0.2.0](https://github.com/jscutlery/nx-plugin-semver/compare/v0.1.1...v0.2.0) (2020-12-28)


### Bug Fixes

* **builder:** 🐞 add @angular-devkit/build-angular dependency ([ab5c208](https://github.com/jscutlery/nx-plugin-semver/commit/ab5c208e71e8bced7301a6b8c0bea7c7a5d17029))
* **builder:** 🐞 resolve workspace definition ([c4bf6b2](https://github.com/jscutlery/nx-plugin-semver/commit/c4bf6b239a2ea7bbd0279f31a78d68bb0782eba7))


### Features

* **ng-add:** ✅ add ng-add schematic ([2db99eb](https://github.com/jscutlery/nx-plugin-semver/commit/2db99eba9b3fbdf354fff2e95c89e6830f68be06))
* **ng-add:** ✅ add target if independent versions ([2be6140](https://github.com/jscutlery/nx-plugin-semver/commit/2be6140c620076e519c569b3a88970b47f47277a))
* **ng-add:** ✅ add workspace project if --sync-versions enabled ([bfa177f](https://github.com/jscutlery/nx-plugin-semver/commit/bfa177f0cd2d4159fbe38645561a6d807aaa78bb))
* **ng-add:** ✅ add workspace project to Nx config ([c4cf38f](https://github.com/jscutlery/nx-plugin-semver/commit/c4cf38f32cb3a6c37db915a2760259fe0bea3b26))
* **ng-add:** ✅ set independent versions by default ([95ff736](https://github.com/jscutlery/nx-plugin-semver/commit/95ff7364b5861c9cc9b83e37ebd2559f8f94561b))
* ✅ add --sync-versions option ([2fdf2c3](https://github.com/jscutlery/nx-plugin-semver/commit/2fdf2c3b0ff3288e18cdbd3a64b200ae45c05512)), closes [#5](https://github.com/jscutlery/nx-plugin-semver/issues/5)
* ✅ fallback to angular.json if workspace.json is not found ([2b0ab57](https://github.com/jscutlery/nx-plugin-semver/commit/2b0ab57dc55f14af952b20f55b7a0f0dd6261b42))



## [0.1.1](https://github.com/jscutlery/nx-plugin-semver/compare/v0.1.0...v0.1.1) (2020-12-05)


### Bug Fixes

* 🐞 builder schema and error handling ([99bb560](https://github.com/jscutlery/nx-plugin-semver/commit/99bb56058195c70d89f6c789cae5351df0b6118a))



# [0.1.0](https://github.com/jscutlery/nx-plugin-semver/compare/v0.0.1...v0.1.0) (2020-12-05)


### Bug Fixes

* 🐞 do not push with --dry-run ([8b40a04](https://github.com/jscutlery/nx-plugin-semver/commit/8b40a048452ed9d6cb5cdc6816882133a5aa08cf))
* 🐞 normalize options ([248b75e](https://github.com/jscutlery/nx-plugin-semver/commit/248b75e86e31995d3bcb6f7349da7743f22093e8))


### Features

* ✅ add `--push` option ([2dc9aa6](https://github.com/jscutlery/nx-plugin-semver/commit/2dc9aa6ee2cd90d2f1d5de14b32ff344fc303de0))
* ✅ apply no-verify to push too ([b0f3c76](https://github.com/jscutlery/nx-plugin-semver/commit/b0f3c767986635812f81239fcad495e92e80eaea))
* ✅ use angular preset ([67312bf](https://github.com/jscutlery/nx-plugin-semver/commit/67312bf19e24f8731c22be1944bf5bdb2aff65e4))



### 0.0.1 (2020-12-04)


### Features

* ✅ add version builder ([30509e7](https://github.com/jscutlery/nx-plugin-semver/commit/30509e7153cb524060407b89fd6ef615a939254b))
