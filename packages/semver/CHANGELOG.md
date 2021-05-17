# Changelog

This file was generated using [@jscutlery/semver](https://github.com/jscutlery/semver).

## [2.2.1](https://github.com/jscutlery/nx-plugin-semver/compare/semver-2.2.0...semver-2.2.1) (2021-05-17)


### Bug Fixes

* **semver:** 🐞 fix $schema ref ([009c230](https://github.com/jscutlery/nx-plugin-semver/commit/009c2307e33c0d64464b4c9061ef6a1c8faef736))



# [2.2.0](https://github.com/jscutlery/semver/compare/semver-2.1.0...semver-2.2.0) (2021-05-16)


### Bug Fixes

* **semver:** 🐞 fix json schema id conflict issue ([eeef6f8](https://github.com/jscutlery/semver/commit/eeef6f8b95daf19ead7a9cb3aea2cfae0ea56ed1))
* 📦 update dependency @angular-devkit/build-angular to v0.1102.10 ([39f7559](https://github.com/jscutlery/semver/commit/39f7559f0ee8a5105f8e4e8ba778dc8edde58c66))
* 📦 update dependency @angular-devkit/build-angular to v0.1102.11 ([4f8855c](https://github.com/jscutlery/semver/commit/4f8855c8d96bac79902392ba9bf690c05c17a373))
* 📦 update dependency @angular-devkit/build-angular to v0.1102.12 ([635a32d](https://github.com/jscutlery/semver/commit/635a32d6ee32a9b099f7cd0a0f9f8374c2aef1a5))
* 📦 update dependency @angular-devkit/build-angular to v0.1102.13 ([8b7418f](https://github.com/jscutlery/semver/commit/8b7418f78905f0474738a19743f9af9d57649767))
* 📦 update dependency @angular-devkit/build-angular to v0.1102.9 ([f652491](https://github.com/jscutlery/semver/commit/f652491d520c4936668d1e246d7c482bc226aaee))
* 📦 update dependency inquirer to v8 ([f07f21d](https://github.com/jscutlery/semver/commit/f07f21d8cfaa7d66f27e33dbe3b80922087a9ed4))


### Features

* ✅ add changelog header option ([205851b](https://github.com/jscutlery/semver/commit/205851bce9f457423de58e36d164ea3b2a60c63d))



# [2.1.0](https://github.com/jscutlery/semver/compare/semver-2.0.0...semver-2.1.0) (2021-04-15)


### Features

* ✅ when --version option is used, bump even if no changes ([074dc2d](https://github.com/jscutlery/semver/commit/074dc2d02e522556d22ba71b23af3dc99a1a39db)), closes [#151](https://github.com/jscutlery/semver/issues/151)



# [2.0.0](https://github.com/jscutlery/semver/compare/semver-1.4.0...semver-2.0.0) (2021-04-13)


### Bug Fixes

* 📦 update dependency @angular-devkit/build-angular to v0.1102.8 ([5493164](https://github.com/jscutlery/semver/commit/5493164d9322e43b4acaf2b5bd937d479db53f9a))


### Features

* ✅ add --skip-project-changelog option ([5bd57f9](https://github.com/jscutlery/semver/commit/5bd57f96f83c624d96f81a291b74a9f19c744cf5))
* ✅ refactor --root-changelog option to --skip-root-changelog ([2fa3c9b](https://github.com/jscutlery/semver/commit/2fa3c9b3122e663a2e6120afc409436536c6a9cf))


### BREAKING CHANGES

* removed --root-changelog option in favor of --skip-root-changelog



# [1.4.0](https://github.com/jscutlery/nx-plugin-semver/compare/semver-1.3.1...semver-1.4.0) (2021-04-08)


### Bug Fixes

* 🐞 don't silently fail when error is an object ([0e8199d](https://github.com/jscutlery/nx-plugin-semver/commit/0e8199de0f4890309930659e402f7145545689e8))
* 🐞 exec Git add only once to avoid file lock ([4dfce73](https://github.com/jscutlery/nx-plugin-semver/commit/4dfce73b399f404e1b568595e4af8d452a672a1c))
* 🐞 release since first commit if no version found (resolve [#102](https://github.com/jscutlery/nx-plugin-semver/issues/102)) ([f882009](https://github.com/jscutlery/nx-plugin-semver/commit/f882009dfc93a18f29ca23d95767c9ba250c31b0))
* 📦 update dependency @angular-devkit/build-angular to v0.1101.4 ([bbe6d07](https://github.com/jscutlery/nx-plugin-semver/commit/bbe6d07d62891cc8e7dca7ae2886bbfd9b8f92da))
* 📦 update dependency @angular-devkit/build-angular to v0.1102.0 ([cd7af9d](https://github.com/jscutlery/nx-plugin-semver/commit/cd7af9dfd408c721fd8f325cff7573cc48bb7821))
* 📦 update dependency @angular-devkit/build-angular to v0.1102.1 ([c5a0fd5](https://github.com/jscutlery/nx-plugin-semver/commit/c5a0fd558e2ecd48d514df5d55305878540e5a18))
* 📦 update dependency @angular-devkit/build-angular to v0.1102.2 ([a2bccc7](https://github.com/jscutlery/nx-plugin-semver/commit/a2bccc75ed70a4e5e71f1d7d23bda80d07b55d44))
* 📦 update dependency @angular-devkit/build-angular to v0.1102.3 ([121ab29](https://github.com/jscutlery/nx-plugin-semver/commit/121ab295cb984f7e52b81473184f844f5fd123f6))
* 📦 update dependency @angular-devkit/build-angular to v0.1102.4 ([1484ff7](https://github.com/jscutlery/nx-plugin-semver/commit/1484ff733ee7075fd2d4edb242c037ba3bff9001))
* 📦 update dependency @angular-devkit/build-angular to v0.1102.5 ([b1b5e85](https://github.com/jscutlery/nx-plugin-semver/commit/b1b5e85ad602f6306477b1d62f6eb94e849697b0))
* 📦 update dependency @angular-devkit/build-angular to v0.1102.6 ([817572d](https://github.com/jscutlery/nx-plugin-semver/commit/817572de0870325a61c2b6cfadf8cfed13a87c49))
* 📦 update dependency @angular-devkit/build-angular to v0.1102.7 ([4b20593](https://github.com/jscutlery/nx-plugin-semver/commit/4b2059355e08db6980626ebd5eac4993980f6b5d))


### Features

* ✅ bump version explicitly through parameters ([69aec3d](https://github.com/jscutlery/nx-plugin-semver/commit/69aec3d47b048359089fee13fc4fe911850e5465)), closes [#56](https://github.com/jscutlery/nx-plugin-semver/issues/56)



## [1.3.1](https://github.com/jscutlery/semver/compare/semver-1.3.0...semver-1.3.1) (2021-02-02)


### Bug Fixes

* 🐞 don't crash when `workspace.json` is not found ([49d3789](https://github.com/jscutlery/semver/commit/49d3789a1961a590c194229938676f4d8e576929)), closes [#64](https://github.com/jscutlery/semver/issues/64)
* 📦 update dependency @angular-devkit/build-angular to v0.1101.2 ([65e3951](https://github.com/jscutlery/semver/commit/65e3951027c398ec34d497ed47b559f6c02cdc76))



# [1.3.0](https://github.com/jscutlery/nx-plugin-semver/compare/semver-1.2.0...semver-1.3.0) (2021-01-29)


### Features

* ✅ parallelize changelogs generation ([de6418a](https://github.com/jscutlery/nx-plugin-semver/commit/de6418a4f143a5414cbca17e6e0fcc484eb5eae6))



# [1.2.0](https://github.com/jscutlery/semver/compare/semver-1.1.0...semver-1.2.0) (2021-01-28)


### Bug Fixes

* 🐞 first release now bumps ([c0970b9](https://github.com/jscutlery/semver/commit/c0970b9601bb819def1fc51fcce8f1e66a3ae199)), closes [#42](https://github.com/jscutlery/semver/issues/42)
* 📦 update dependency @angular-devkit/build-angular to v0.1100.7 ([b66532b](https://github.com/jscutlery/semver/commit/b66532beeb9391c97a141e9f5090f88931e36c1e))
* 📦 update dependency @angular-devkit/build-angular to v0.1101.0 ([7a7f5f9](https://github.com/jscutlery/semver/commit/7a7f5f989c5ed7fc7641654b53fa8daf43dfa6ab))
* 📦 update dependency @angular-devkit/build-angular to v0.1101.1 ([4ca7056](https://github.com/jscutlery/semver/commit/4ca70566d4d58b7f4277f44d83424c84a78f7998))


### Features

* ✅ bump only if project or workspace has changes since last release ([622513b](https://github.com/jscutlery/semver/commit/622513b1305127c9dbe49e2a459c69dcefa7069d)), closes [#35](https://github.com/jscutlery/semver/issues/35)
* ✅ generate sub-changelogs in sync mode ([14a9b3c](https://github.com/jscutlery/semver/commit/14a9b3caf9288b4eac04602f3cc1d4917cbf9020)), closes [#42](https://github.com/jscutlery/semver/issues/42)
* ✅ inform when release is interrupted if no changes ([1c798a8](https://github.com/jscutlery/semver/commit/1c798a81875178481f3f56c8c5f8b3aa1e7fa364))



# [1.1.0](https://github.com/jscutlery/nx-plugin-semver/compare/semver-1.0.0...semver-1.1.0) (2021-01-08)


### Bug Fixes

* 📦 update dependency @angular-devkit/build-angular to v0.1100.6 ([0515ab0](https://github.com/jscutlery/nx-plugin-semver/commit/0515ab0cff27cc2cedb77c607d855bd55fa14861))


### Features

* ✅ autodetect first release, remove related option ([a9b7107](https://github.com/jscutlery/nx-plugin-semver/commit/a9b7107b978024707ff14debc8c9c2991f17ab1a)), closes [#1](https://github.com/jscutlery/nx-plugin-semver/issues/1)



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
