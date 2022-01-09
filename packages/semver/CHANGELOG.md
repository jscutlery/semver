# Changelog

This file was generated using [@jscutlery/semver](https://github.com/jscutlery/semver).

## [2.17.4](https://github.com/jscutlery/semver/compare/semver-2.17.3...semver-2.17.4) (2022-01-09)


### Bug Fixes

* **semver:** 🐞 calculate notes from root changelog ([2f26cad](https://github.com/jscutlery/semver/commit/2f26cade3bdd677c85db0336e2dc5b2f320e03d8))



## [2.17.3](https://github.com/jscutlery/semver/compare/semver-2.17.2...semver-2.17.3) (2021-12-30)


### Bug Fixes

* **semver:** 🐞 bump `@commitlint/*` deps ([5f0a4f5](https://github.com/jscutlery/semver/commit/5f0a4f547d7800b6ed19d4956e3beb646bd3dae1))
* **semver:** 🐞 fix `gh` CLI error handling ([3d87938](https://github.com/jscutlery/semver/commit/3d87938adb7b546cdc341e1fc112187851726255))



## [2.17.2](https://github.com/jscutlery/semver/compare/semver-2.17.1...semver-2.17.2) (2021-12-29)


### Bug Fixes

* **semver:** 🐞 log `gh` CLI errors ([871a039](https://github.com/jscutlery/semver/commit/871a03982f7c70c5b15cb09b038a7573b71be572))
* **semver:** 🐞 rename `--branch` to `--target` ([ca1c539](https://github.com/jscutlery/semver/commit/ca1c539e888d3bbb334038d888ba905dfc5e282c))



## [2.17.1](https://github.com/jscutlery/semver/compare/semver-2.17.0...semver-2.17.1) (2021-12-29)


### Reverts

* ⚙️ debug github executor ([925760d](https://github.com/jscutlery/semver/commit/925760d37ab270430177682507449c38582a78c0))



# [2.17.0](https://github.com/jscutlery/semver/compare/semver-2.16.1...semver-2.17.0) (2021-12-29)


### Bug Fixes

* **semver:** 🐞 correctly run `gh` command ([63346e7](https://github.com/jscutlery/semver/commit/63346e7c3e05527b8631107c6ab29bcf983550e9))


### Features

* **semver:** ✅ add `--generate-notes` option ([6824a12](https://github.com/jscutlery/semver/commit/6824a12219f78d45a81a84a178f032916f874b71))



## [2.16.1](https://github.com/jscutlery/semver/compare/semver-2.16.0...semver-2.16.1) (2021-12-28)


### Bug Fixes

* **semver:** 🐞 use `execFile` for command execution ([b51903b](https://github.com/jscutlery/semver/commit/b51903b246ed1f4876448abd1a0d3ebe64843f2c)), closes [#350](https://github.com/jscutlery/semver/issues/350)



# [2.16.0](https://github.com/jscutlery/semver/compare/semver-2.15.0...semver-2.16.0) (2021-12-27)


### Features

* **semver:** ✅ configure default `--commitMessageFormat` ([6388bc7](https://github.com/jscutlery/semver/commit/6388bc7e793a9b878a5623c7c2220fc028691f47))



# [2.15.0](https://github.com/jscutlery/semver/compare/semver-2.14.4...semver-2.15.0) (2021-12-05)


### Features

* **semver:** ✅ provide relative notes to post targets ([3f523f1](https://github.com/jscutlery/semver/commit/3f523f1a45f8ebe0d8428b1feb28501d9628dd8d))



## [2.14.4](https://github.com/jscutlery/semver/compare/semver-2.14.3...semver-2.14.4) (2021-12-05)



## [2.14.3](https://github.com/jscutlery/semver/compare/semver-2.14.2...semver-2.14.3) (2021-11-29)


### Bug Fixes

* **semver:** 🐞 add log when push succeed ([bdf7abf](https://github.com/jscutlery/semver/commit/bdf7abf8e231f9d3c83a50877cc1180abc4fb7ae))
* **semver:** 🐞 fallback to default commit message format ([5bdc696](https://github.com/jscutlery/semver/commit/5bdc6964f8f41cd70ce6ca1a90d37553c13f01a8))



## [2.14.2](https://github.com/jscutlery/semver/compare/semver-2.14.1...semver-2.14.2) (2021-11-29)



## [2.14.1](https://github.com/jscutlery/semver/compare/semver-2.14.0...semver-2.14.1) (2021-11-29)



# [2.14.0](https://github.com/jscutlery/semver/compare/semver-2.13.3...semver-2.14.0) (2021-11-28)


### Bug Fixes

* **semver:** 🐞 correctly forward `--no-verify` ([50ec0ed](https://github.com/jscutlery/semver/commit/50ec0ed5b153213a623102285865a1694db3f258))


### Features

* **semver:** ✅ add `--commitMessageFormat` option ([b8e9674](https://github.com/jscutlery/semver/commit/b8e9674c257594f31e744cae6cf6a35af40f1a3b))



## [2.13.3](https://github.com/jscutlery/semver/compare/semver-2.13.2...semver-2.13.3) (2021-11-22)


### Bug Fixes

* **semver:** handle post target executor errors ([c4282a0](https://github.com/jscutlery/semver/commit/c4282a07e5e6a68edf53e9a19a8c8fc69d082ce5))



## [2.13.2](https://github.com/jscutlery/semver/compare/semver-2.13.1...semver-2.13.2) (2021-11-21)


### Bug Fixes

* **semver:** bump [@commitlint](https://github.com/commitlint) deps + remove config-conventional ([0cf6d9b](https://github.com/jscutlery/semver/commit/0cf6d9bcae761e394d5436622df473b87d06705b))
* **semver:** remove commitizen from install generator ([2a9b731](https://github.com/jscutlery/semver/commit/2a9b7314569a04be69719e14b2f1a809420cc16c))



## [2.13.1](https://github.com/jscutlery/semver/compare/semver-2.13.0...semver-2.13.1) (2021-11-11)


### Bug Fixes

* **semver:** write commitlint config into json ([#383](https://github.com/jscutlery/semver/issues/383)) ([f4013fd](https://github.com/jscutlery/semver/commit/f4013fd3d25fb9999d55db3e087550c33f16b225))



# [2.13.0](https://github.com/jscutlery/semver/compare/semver-2.12.0...semver-2.13.0) (2021-11-04)


### Features

* **semver:** follow `@commitlint/config-angular` rules ([71f3fed](https://github.com/jscutlery/semver/commit/71f3fedf49f26b47da9e28fae56dfe11540ecd06))



# [2.12.0](https://github.com/jscutlery/semver/compare/semver-2.11.5...semver-2.12.0) (2021-11-04)


### Features

* **semver:** add `--baseBranch` option to install generator ([0aa8626](https://github.com/jscutlery/semver/commit/0aa8626cdd4d4ad4f8764f197f48f55a53532fcc))



## [2.11.5](https://github.com/jscutlery/semver/compare/semver-2.11.4...semver-2.11.5) (2021-10-30)



## [2.11.4](https://github.com/jscutlery/semver/compare/semver-2.11.3...semver-2.11.4) (2021-10-30)


### Bug Fixes

* **github:** use correct property type ([#370](https://github.com/jscutlery/semver/issues/370)) ([0e67599](https://github.com/jscutlery/semver/commit/0e67599e369555e4181bb7055f9e1181e3baeaf1))



## [2.11.3](https://github.com/jscutlery/semver/compare/semver-2.11.2...semver-2.11.3) (2021-10-30)


### Bug Fixes

* **semver:** bump project graph version ([#369](https://github.com/jscutlery/semver/issues/369)) ([69dd708](https://github.com/jscutlery/semver/commit/69dd708725b2bdd6ec8c3526d304fbf5cf8d220b))



## [2.11.2](https://github.com/jscutlery/semver/compare/semver-2.11.1...semver-2.11.2) (2021-10-29)



## [2.11.1](https://github.com/jscutlery/semver/compare/semver-2.11.0...semver-2.11.1) (2021-10-29)


### Bug Fixes

* **semver:** 🐞 ensure projects option is defined ([#362](https://github.com/jscutlery/semver/issues/362)) ([51bac25](https://github.com/jscutlery/semver/commit/51bac25c7cec865dbd9125a7740d8f845166cfef))



# [2.11.0](https://github.com/jscutlery/semver/compare/semver-2.10.0...semver-2.11.0) (2021-10-25)


### Bug Fixes

* :label: Adde shim for standard-lib deep imports ([c66acbf](https://github.com/jscutlery/semver/commit/c66acbf1058e01b9c2e27f38d4469ec767e5fdeb)), closes [#324](https://github.com/jscutlery/semver/issues/324)
* :label: Fixed types ([d31ccfe](https://github.com/jscutlery/semver/commit/d31ccfe301970aa111667779644427448250fb52)), closes [#324](https://github.com/jscutlery/semver/issues/324)
* :label: Fixed types and operators ([b1ec423](https://github.com/jscutlery/semver/commit/b1ec4238b8db55f75d11522ce104c8955c7e3b7c)), closes [#324](https://github.com/jscutlery/semver/issues/324)
* :label: Fixed types and operators ([5f87262](https://github.com/jscutlery/semver/commit/5f87262239488564ef00163f5aef2d6150d47628)), closes [#324](https://github.com/jscutlery/semver/issues/324)
* :label: Fixed typescript strict issues and deprecations ([c38a38e](https://github.com/jscutlery/semver/commit/c38a38ee13f0e9c883152b2b08ed961573c29c58)), closes [#342](https://github.com/jscutlery/semver/issues/342)
* :package: Added dep to rxjs 7 to semver ([d937eda](https://github.com/jscutlery/semver/commit/d937eda553d629afb745dd1c77ddff0e1b08a977)), closes [#324](https://github.com/jscutlery/semver/issues/324)
* :wrench: Added missing types and use esModuleInterop ([f5d2b03](https://github.com/jscutlery/semver/commit/f5d2b0308d7b51e68cbe75bd7434a9850982b8a1)), closes [#324](https://github.com/jscutlery/semver/issues/324)
* changing the --track-deps option to only increment a patch ([a27e76e](https://github.com/jscutlery/semver/commit/a27e76e7a408537ed1410a1322851f9d9379eef3))
* cleaning up a merge issue ([ca98d55](https://github.com/jscutlery/semver/commit/ca98d554200bcce4c5e3cc85f43c9a683c1b3d06))
* cleaning up after a rebase ([7e4fa79](https://github.com/jscutlery/semver/commit/7e4fa790bcb0125ac08933a7fe742682d6b5ef4d))
* fixing a messed up merge of the version schema ([4d02faf](https://github.com/jscutlery/semver/commit/4d02faf149a9bb14c92b8e16e1203815aa21fdad))
* fixing a rebase issue ([75c37ca](https://github.com/jscutlery/semver/commit/75c37ca619b4bef0ec4369600c58bf2a943253ab))
* **semver:** bump dependencies ([12468de](https://github.com/jscutlery/semver/commit/12468dea3e5a9b18968e33b5d50af4ff4576f898))
* **semver:** bump generator deps ([e1c9052](https://github.com/jscutlery/semver/commit/e1c90522ede345cb316aa4b88e0f25f9a7c68e9b))
* **semver:** changing the --use-deps option to --track-deps ([f909d5e](https://github.com/jscutlery/semver/commit/f909d5ed052ca3743dd22b69799229465e0eea5b))
* **semver:** fixing some linting issues ([c6c29de](https://github.com/jscutlery/semver/commit/c6c29de14f706dd9a48823722c73906d44942cc8))
* **semver:** fixing some linting issues ([27af0f8](https://github.com/jscutlery/semver/commit/27af0f842ca26bad5c4ac4f5db0eb209eaa0048c))
* **semver:** making --track-deps only read one dependency deep ([62468eb](https://github.com/jscutlery/semver/commit/62468eb296a57b3be2bfc143f068c42a6d41daa6))
* **semver:** resolve boolean arguments correctly ([bbd55dd](https://github.com/jscutlery/semver/commit/bbd55dd139d0afe9c1951e2d5988871b53303573)), closes [#353](https://github.com/jscutlery/semver/issues/353)
* **semver:** Switching to using project graph functions directly, instead of the CLI. ([dedde3f](https://github.com/jscutlery/semver/commit/dedde3f5c90c65df4c27dcf16dd619d8be36fc2c))


### Features

* :heavy_plus_sign: Added types and config entries ([b22875e](https://github.com/jscutlery/semver/commit/b22875ebd9c94e2ce23d94f2252c90499b7715d7)), closes [#342](https://github.com/jscutlery/semver/issues/342)
* **github:** ✅ add missing options to github executor ([603ac25](https://github.com/jscutlery/semver/commit/603ac25737fde7f0fcd006ced8afd13293683779))
* **github:** ✅ add missing options to github executor ([bfb466d](https://github.com/jscutlery/semver/commit/bfb466de466b3940eb4f50e02ed76176fb785761))
* **github:** ✅ add test for missing github executor ([7480e1e](https://github.com/jscutlery/semver/commit/7480e1e022e6f5c73444c56e0e4014b078c31e6a))
* **semver:** Adding in a `--use-deps` flag to include dependencies when calculating the version bump ([7d9e4c9](https://github.com/jscutlery/semver/commit/7d9e4c9a2e50cbe4dbd77fe7e6a77ba2a2946351))
* **semver:** Adding in a `--use-deps` flag to include dependencies when calculating the version bump ([8f23095](https://github.com/jscutlery/semver/commit/8f23095aae6e40b5b8fd4400dcfae660ee4015ad))



# [2.10.0](https://github.com/jscutlery/nx-plugin-semver/compare/semver-2.9.0...semver-2.10.0) (2021-10-07)


### Features

* **github:** ✅ add `--notes` and `--notesFile` support ([68ef734](https://github.com/jscutlery/nx-plugin-semver/commit/68ef7340a2c0c6263c7d19f666d38aa3d9f3b2cf))



# [2.9.0](https://github.com/jscutlery/nx-plugin-semver/compare/semver-2.8.1...semver-2.9.0) (2021-10-06)


### Bug Fixes

* **github:** 🐞 handle files and error correctly ([08cc021](https://github.com/jscutlery/nx-plugin-semver/commit/08cc0214a49e8afef694048786c3b555e8c8d85b))
* **semver:** 🐞 forward valid version to post targets ([e5b15be](https://github.com/jscutlery/nx-plugin-semver/commit/e5b15be73f915920e8c57e21c2fe11d95169f4b0))
* **semver:** 🐞 handle post-targets SchemaError ([09ffbae](https://github.com/jscutlery/nx-plugin-semver/commit/09ffbaeb7120b5e519f299fec74f9a20138c5a74))
* **semver:** 🐞 resolve post target correctly ([b209832](https://github.com/jscutlery/nx-plugin-semver/commit/b209832235a1281141ff72d462f0377b31abadea))
* **semver:** 🐞 use default export for version builder ([f334900](https://github.com/jscutlery/nx-plugin-semver/commit/f334900ad6902a4da76b643dc959333868f7be9a))
* **semver:** 🐞 use only string schema ([304f16c](https://github.com/jscutlery/nx-plugin-semver/commit/304f16cd1fa93f989bb3021a1ef0dd84856b23b1))
* use standalone projects ([22476c4](https://github.com/jscutlery/nx-plugin-semver/commit/22476c4ab52668fa200454df4b8e20abed893595)), closes [#320](https://github.com/jscutlery/nx-plugin-semver/issues/320)


### Features

* **github:** ✅ add `@jscutlery/semver:github` executor ([637758b](https://github.com/jscutlery/nx-plugin-semver/commit/637758beebe2eeb829c35465955423f0f0b3e526))
* **github:** ✅ support branch argument ([d38b048](https://github.com/jscutlery/nx-plugin-semver/commit/d38b048748118e0ee3e1c865ed96a816027a88e1))
* **github:** ✅ support files argument ([8a86aa0](https://github.com/jscutlery/nx-plugin-semver/commit/8a86aa0343f99be455816eec276200f108a94b7c))
* **semver:** ✅ add `postTargets` option ([#167](https://github.com/jscutlery/nx-plugin-semver/issues/167)) ([133ef71](https://github.com/jscutlery/nx-plugin-semver/commit/133ef717edb7d269e77eb0e4459e9fff7f160f46))
* **semver:** ✅ resolve `tag` property ([102021b](https://github.com/jscutlery/nx-plugin-semver/commit/102021b440a13587691236036f26e75c4be69f89))



## [2.8.1](https://github.com/jscutlery/nx-plugin-semver/compare/semver-2.8.0...semver-2.8.1) (2021-10-01)


### Bug Fixes

* **semver:** 🐞 add --releaseAs argument ([ec20b09](https://github.com/jscutlery/nx-plugin-semver/commit/ec20b094dc361dd931a485072d50f1d3f84c0f3c)), closes [#236](https://github.com/jscutlery/nx-plugin-semver/issues/236) [#218](https://github.com/jscutlery/nx-plugin-semver/issues/218)



# [2.8.0](https://github.com/jscutlery/semver/compare/semver-2.7.1...semver-2.8.0) (2021-09-17)


### Bug Fixes

* **semver:** 🐞 support Angular CLI workspace definition ([416d6bb](https://github.com/jscutlery/semver/commit/416d6bbfd0331a3ff9d5faaa6e0dd8b573a71cdd)), closes [discussion#6955](https://github.com/nrwl/nx/discussions/6955#discussioncomment-1341893)

### Features

* **semver:** ✅ bump install generator dependencies ([9de8f17](https://github.com/jscutlery/semver/commit/9de8f17cda699ebc58a4bb4b89a3b2f61071fa5f))



## [2.7.1](https://github.com/jscutlery/semver/compare/semver-2.7.0...semver-2.7.1) (2021-09-15)


### Bug Fixes

* **semver:** 🐞 handle child process error gracefully ([23dfee6](https://github.com/jscutlery/semver/commit/23dfee60665e2ccfa9de3b4f495341d4cfdc7fa7)), closes [#196](https://github.com/jscutlery/semver/issues/196)
* **semver:** 🐞 update migration target ([6a22938](https://github.com/jscutlery/semver/commit/6a22938e40b954fe2a49b1c85dc549c19cd79108))



# [2.7.0](https://github.com/jscutlery/semver/compare/semver-2.6.0...semver-2.7.0) (2021-09-07)


### Bug Fixes

* **semver:** 🐞 install generator fails when .husky folder exists ([ac9556c](https://github.com/jscutlery/semver/commit/ac9556c442ea83d6bdd514285531b64042c5ccdb))


### Features

* **semver:** ✔️  use undefined as default value of versionTagPrefix ([7cbafb2](https://github.com/jscutlery/semver/commit/7cbafb2d80be267d49d625f28681857bbfe40cd7))



# [2.6.0](https://github.com/jscutlery/semver/compare/semver-2.5.0...semver-2.6.0) (2021-08-09)


### Bug Fixes

* **semver:** 🐞 add `@nrwl/schematics` dependency ([3382473](https://github.com/jscutlery/semver/commit/3382473fefbf173b19f861d9cf2851db1bb5151c))
* **semver:** 🐞 add missing schema cli property ([9006e26](https://github.com/jscutlery/semver/commit/9006e26e52cfccde837e0676f96ad3bb6868e02e))
* **semver:** 🐞 ensure package install after fs commited ([72b44b7](https://github.com/jscutlery/semver/commit/72b44b74b38476639bdf25f99470dc63274e7649))


### Features

* **semver:** add custom tag prefix implementation ([4bc45e3](https://github.com/jscutlery/semver/commit/4bc45e3e98b106eb0deb6ef32711895656a4c665))
* **semver:** add tag template string support ([91dec48](https://github.com/jscutlery/semver/commit/91dec484aa6221b429588bfd753c399881801f61))



# [2.5.0](https://github.com/jscutlery/semver/compare/semver-2.4.0...semver-2.5.0) (2021-08-05)


### Bug Fixes

* 📦 update dependency @angular-devkit/build-angular to v12 ([52792a6](https://github.com/jscutlery/semver/commit/52792a6369caac9f4084b8d2c41514a15015a027))



# [2.4.0](https://github.com/jscutlery/semver/compare/semver-2.3.1...semver-2.4.0) (2021-07-07)


### Features

* ✅ handle extracted project's configuration ([#230](https://github.com/jscutlery/semver/issues/230)) ([924347a](https://github.com/jscutlery/semver/commit/924347aeea24a50e3e31633c7ddeafe2e0cae4ba))



## [2.3.1](https://github.com/jscutlery/semver/compare/semver-2.3.0...semver-2.3.1) (2021-06-08)


### Bug Fixes

* **ng-add:** only allow read write and execution from owner ([41b7b30](https://github.com/jscutlery/semver/commit/41b7b3044d2188ced3fddfbf5fbd9b3bd7b0a703))
* 📦 update dependency @angular-devkit/build-angular to v0.1102.14 ([c16d0fa](https://github.com/jscutlery/semver/commit/c16d0fa53e141d7c2067e20d4cec959d468a433b))
* **ng-add:** fix id schema property warning ([5d67597](https://github.com/jscutlery/semver/commit/5d6759739003f354b3d2c180dcc2f343e8232ee8))



# [2.3.0](https://github.com/jscutlery/semver/compare/semver-2.2.1...semver-2.3.0) (2021-06-03)


### Bug Fixes

* **ng-add:** execute prepare ([43ada7c](https://github.com/jscutlery/semver/commit/43ada7c7d33712fd5d461f1629b676fab91aead9))
* **ng-add:** fix wrong code ([4b814c6](https://github.com/jscutlery/semver/commit/4b814c688010a3f7ddf7f487faa145d63f933566))
* **ng-add:** update husky file check ([de1754e](https://github.com/jscutlery/semver/commit/de1754e647aa3674dc655a16bfff601e1b079664))


### Features

* **ng-add:** add commitizen ([8c1d996](https://github.com/jscutlery/semver/commit/8c1d996e773a23bb8db0e27e95ae6d26a30b9637))
* **ng-add:** add commitlint ([741f76c](https://github.com/jscutlery/semver/commit/741f76c02eb8152217cfd1a89d4cd6d2f6453b31))
* **ng-add:** add husky ([4f5c202](https://github.com/jscutlery/semver/commit/4f5c202bae39d2bf5dd88b0d281e3b9ddd490d04))
* **ng-add:** add new options to enforce CC ([4621059](https://github.com/jscutlery/semver/commit/4621059e689a139abcfa70a7f71a10ea32cdf46a))
* **ng-add:** check husky config before create ([bf3590d](https://github.com/jscutlery/semver/commit/bf3590d9b2cbf251c47ee4a8cce1a49955b56dbb))
* **ng-add:** make commit-msg executable ([fbcb930](https://github.com/jscutlery/semver/commit/fbcb9308d300347e2fda36e37622992ccb928e63))
* **ng-add:** remove uneeded code ([496ec3e](https://github.com/jscutlery/semver/commit/496ec3e89a525aaafbae7c90b50ab70e0f4fff11))
* **ng-add:** update behavior and code cleanup ([d8eb821](https://github.com/jscutlery/semver/commit/d8eb821800e8f9245eaf859d7afc2e6ce206e3d2))



## [2.2.1](https://github.com/jscutlery/semver/compare/semver-2.2.0...semver-2.2.1) (2021-05-17)


### Bug Fixes

* **semver:** 🐞 fix $schema ref ([009c230](https://github.com/jscutlery/semver/commit/009c2307e33c0d64464b4c9061ef6a1c8faef736))



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



# [1.4.0](https://github.com/jscutlery/semver/compare/semver-1.3.1...semver-1.4.0) (2021-04-08)


### Bug Fixes

* 🐞 don't silently fail when error is an object ([0e8199d](https://github.com/jscutlery/semver/commit/0e8199de0f4890309930659e402f7145545689e8))
* 🐞 exec Git add only once to avoid file lock ([4dfce73](https://github.com/jscutlery/semver/commit/4dfce73b399f404e1b568595e4af8d452a672a1c))
* 🐞 release since first commit if no version found (resolve [#102](https://github.com/jscutlery/semver/issues/102)) ([f882009](https://github.com/jscutlery/semver/commit/f882009dfc93a18f29ca23d95767c9ba250c31b0))
* 📦 update dependency @angular-devkit/build-angular to v0.1101.4 ([bbe6d07](https://github.com/jscutlery/semver/commit/bbe6d07d62891cc8e7dca7ae2886bbfd9b8f92da))
* 📦 update dependency @angular-devkit/build-angular to v0.1102.0 ([cd7af9d](https://github.com/jscutlery/semver/commit/cd7af9dfd408c721fd8f325cff7573cc48bb7821))
* 📦 update dependency @angular-devkit/build-angular to v0.1102.1 ([c5a0fd5](https://github.com/jscutlery/semver/commit/c5a0fd558e2ecd48d514df5d55305878540e5a18))
* 📦 update dependency @angular-devkit/build-angular to v0.1102.2 ([a2bccc7](https://github.com/jscutlery/semver/commit/a2bccc75ed70a4e5e71f1d7d23bda80d07b55d44))
* 📦 update dependency @angular-devkit/build-angular to v0.1102.3 ([121ab29](https://github.com/jscutlery/semver/commit/121ab295cb984f7e52b81473184f844f5fd123f6))
* 📦 update dependency @angular-devkit/build-angular to v0.1102.4 ([1484ff7](https://github.com/jscutlery/semver/commit/1484ff733ee7075fd2d4edb242c037ba3bff9001))
* 📦 update dependency @angular-devkit/build-angular to v0.1102.5 ([b1b5e85](https://github.com/jscutlery/semver/commit/b1b5e85ad602f6306477b1d62f6eb94e849697b0))
* 📦 update dependency @angular-devkit/build-angular to v0.1102.6 ([817572d](https://github.com/jscutlery/semver/commit/817572de0870325a61c2b6cfadf8cfed13a87c49))
* 📦 update dependency @angular-devkit/build-angular to v0.1102.7 ([4b20593](https://github.com/jscutlery/semver/commit/4b2059355e08db6980626ebd5eac4993980f6b5d))


### Features

* ✅ bump version explicitly through parameters ([69aec3d](https://github.com/jscutlery/semver/commit/69aec3d47b048359089fee13fc4fe911850e5465)), closes [#56](https://github.com/jscutlery/semver/issues/56)



## [1.3.1](https://github.com/jscutlery/semver/compare/semver-1.3.0...semver-1.3.1) (2021-02-02)


### Bug Fixes

* 🐞 don't crash when `workspace.json` is not found ([49d3789](https://github.com/jscutlery/semver/commit/49d3789a1961a590c194229938676f4d8e576929)), closes [#64](https://github.com/jscutlery/semver/issues/64)
* 📦 update dependency @angular-devkit/build-angular to v0.1101.2 ([65e3951](https://github.com/jscutlery/semver/commit/65e3951027c398ec34d497ed47b559f6c02cdc76))



# [1.3.0](https://github.com/jscutlery/semver/compare/semver-1.2.0...semver-1.3.0) (2021-01-29)


### Features

* ✅ parallelize changelogs generation ([de6418a](https://github.com/jscutlery/semver/commit/de6418a4f143a5414cbca17e6e0fcc484eb5eae6))



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



# [1.1.0](https://github.com/jscutlery/semver/compare/semver-1.0.0...semver-1.1.0) (2021-01-08)


### Bug Fixes

* 📦 update dependency @angular-devkit/build-angular to v0.1100.6 ([0515ab0](https://github.com/jscutlery/semver/commit/0515ab0cff27cc2cedb77c607d855bd55fa14861))


### Features

* ✅ autodetect first release, remove related option ([a9b7107](https://github.com/jscutlery/semver/commit/a9b7107b978024707ff14debc8c9c2991f17ab1a)), closes [#1](https://github.com/jscutlery/semver/issues/1)



# [1.0.0](https://github.com/jscutlery/semver/compare/semver-0.4.0...semver-1.0.0) (2021-01-04)


### Features

* ✅ add `-` separator after prefix ([c871d1f](https://github.com/jscutlery/semver/commit/c871d1f728a5f5a69723303e37a533841e202432))


### BREAKING CHANGES

* this will break the changelog without renaming the last tag as standard-version will not be able to find the last tag



# 0.4.0 (2021-01-04)


### Bug Fixes

* 🐞 add tag prefix in independent mode ([e690d37](https://github.com/jscutlery/semver/commit/e690d3710fe1e463379cb61dc65a857b422fc504)), closes [#34](https://github.com/jscutlery/semver/issues/34)
* 🐞 don't add workspace to nx.json with independent versions ([bbab0a7](https://github.com/jscutlery/semver/commit/bbab0a76fbfd4fe421abb96e166a5d6408a41b81))
* **builder:** 🐞 add @angular-devkit/build-angular dependency ([ab5c208](https://github.com/jscutlery/semver/commit/ab5c208e71e8bced7301a6b8c0bea7c7a5d17029))
* **builder:** 🐞 resolve workspace definition ([c4bf6b2](https://github.com/jscutlery/semver/commit/c4bf6b239a2ea7bbd0279f31a78d68bb0782eba7))
* 🐞 builder schema and error handling ([99bb560](https://github.com/jscutlery/semver/commit/99bb56058195c70d89f6c789cae5351df0b6118a))
* 🐞 do not push with --dry-run ([8b40a04](https://github.com/jscutlery/semver/commit/8b40a048452ed9d6cb5cdc6816882133a5aa08cf))
* 🐞 normalize options ([248b75e](https://github.com/jscutlery/semver/commit/248b75e86e31995d3bcb6f7349da7743f22093e8))


### Features

* **ng-add:** ✅ add --projects option override ([69851fb](https://github.com/jscutlery/semver/commit/69851fb61084e08a35e0d648585b71ca4970023f)), closes [#36](https://github.com/jscutlery/semver/issues/36)
* ✅ prompt user for syncing versions ([4de371a](https://github.com/jscutlery/semver/commit/4de371a8d2d6d39d2436ec82f43b5af01c82b8ee))
* **ng-add:** ✅ add ng-add schematic ([2db99eb](https://github.com/jscutlery/semver/commit/2db99eba9b3fbdf354fff2e95c89e6830f68be06))
* **ng-add:** ✅ add target if independent versions ([2be6140](https://github.com/jscutlery/semver/commit/2be6140c620076e519c569b3a88970b47f47277a))
* **ng-add:** ✅ add workspace project if --sync-versions enabled ([bfa177f](https://github.com/jscutlery/semver/commit/bfa177f0cd2d4159fbe38645561a6d807aaa78bb))
* **ng-add:** ✅ add workspace project to Nx config ([c4cf38f](https://github.com/jscutlery/semver/commit/c4cf38f32cb3a6c37db915a2760259fe0bea3b26))
* **ng-add:** ✅ set independent versions by default ([95ff736](https://github.com/jscutlery/semver/commit/95ff7364b5861c9cc9b83e37ebd2559f8f94561b))
* ✅ add --sync-versions option ([2fdf2c3](https://github.com/jscutlery/semver/commit/2fdf2c3b0ff3288e18cdbd3a64b200ae45c05512)), closes [#5](https://github.com/jscutlery/semver/issues/5)
* ✅ add `--push` option ([2dc9aa6](https://github.com/jscutlery/semver/commit/2dc9aa6ee2cd90d2f1d5de14b32ff344fc303de0))
* ✅ add version builder ([30509e7](https://github.com/jscutlery/semver/commit/30509e7153cb524060407b89fd6ef615a939254b))
* ✅ apply no-verify to push too ([b0f3c76](https://github.com/jscutlery/semver/commit/b0f3c767986635812f81239fcad495e92e80eaea))
* ✅ fallback to angular.json if workspace.json is not found ([2b0ab57](https://github.com/jscutlery/semver/commit/2b0ab57dc55f14af952b20f55b7a0f0dd6261b42))
* ✅ use angular preset ([67312bf](https://github.com/jscutlery/semver/commit/67312bf19e24f8731c22be1944bf5bdb2aff65e4))



# [0.3.0](https://github.com/jscutlery/semver/compare/v0.2.1...v0.3.0) (2020-12-31)


### Bug Fixes

* 🐞 add tag prefix in independent mode ([e690d37](https://github.com/jscutlery/semver/commit/e690d3710fe1e463379cb61dc65a857b422fc504)), closes [#34](https://github.com/jscutlery/semver/issues/34)


### Features

* ✅ prompt user for syncing versions ([4de371a](https://github.com/jscutlery/semver/commit/4de371a8d2d6d39d2436ec82f43b5af01c82b8ee))



## [0.2.1](https://github.com/jscutlery/semver/compare/v0.2.0...v0.2.1) (2020-12-28)


### Bug Fixes

* 🐞 don't add workspace to nx.json with independent versions ([bbab0a7](https://github.com/jscutlery/semver/commit/bbab0a76fbfd4fe421abb96e166a5d6408a41b81))



# [0.2.0](https://github.com/jscutlery/semver/compare/v0.1.1...v0.2.0) (2020-12-28)


### Bug Fixes

* **builder:** 🐞 add @angular-devkit/build-angular dependency ([ab5c208](https://github.com/jscutlery/semver/commit/ab5c208e71e8bced7301a6b8c0bea7c7a5d17029))
* **builder:** 🐞 resolve workspace definition ([c4bf6b2](https://github.com/jscutlery/semver/commit/c4bf6b239a2ea7bbd0279f31a78d68bb0782eba7))


### Features

* **ng-add:** ✅ add ng-add schematic ([2db99eb](https://github.com/jscutlery/semver/commit/2db99eba9b3fbdf354fff2e95c89e6830f68be06))
* **ng-add:** ✅ add target if independent versions ([2be6140](https://github.com/jscutlery/semver/commit/2be6140c620076e519c569b3a88970b47f47277a))
* **ng-add:** ✅ add workspace project if --sync-versions enabled ([bfa177f](https://github.com/jscutlery/semver/commit/bfa177f0cd2d4159fbe38645561a6d807aaa78bb))
* **ng-add:** ✅ add workspace project to Nx config ([c4cf38f](https://github.com/jscutlery/semver/commit/c4cf38f32cb3a6c37db915a2760259fe0bea3b26))
* **ng-add:** ✅ set independent versions by default ([95ff736](https://github.com/jscutlery/semver/commit/95ff7364b5861c9cc9b83e37ebd2559f8f94561b))
* ✅ add --sync-versions option ([2fdf2c3](https://github.com/jscutlery/semver/commit/2fdf2c3b0ff3288e18cdbd3a64b200ae45c05512)), closes [#5](https://github.com/jscutlery/semver/issues/5)
* ✅ fallback to angular.json if workspace.json is not found ([2b0ab57](https://github.com/jscutlery/semver/commit/2b0ab57dc55f14af952b20f55b7a0f0dd6261b42))



## [0.1.1](https://github.com/jscutlery/semver/compare/v0.1.0...v0.1.1) (2020-12-05)


### Bug Fixes

* 🐞 builder schema and error handling ([99bb560](https://github.com/jscutlery/semver/commit/99bb56058195c70d89f6c789cae5351df0b6118a))



# [0.1.0](https://github.com/jscutlery/semver/compare/v0.0.1...v0.1.0) (2020-12-05)


### Bug Fixes

* 🐞 do not push with --dry-run ([8b40a04](https://github.com/jscutlery/semver/commit/8b40a048452ed9d6cb5cdc6816882133a5aa08cf))
* 🐞 normalize options ([248b75e](https://github.com/jscutlery/semver/commit/248b75e86e31995d3bcb6f7349da7743f22093e8))


### Features

* ✅ add `--push` option ([2dc9aa6](https://github.com/jscutlery/semver/commit/2dc9aa6ee2cd90d2f1d5de14b32ff344fc303de0))
* ✅ apply no-verify to push too ([b0f3c76](https://github.com/jscutlery/semver/commit/b0f3c767986635812f81239fcad495e92e80eaea))
* ✅ use angular preset ([67312bf](https://github.com/jscutlery/semver/commit/67312bf19e24f8731c22be1944bf5bdb2aff65e4))



### 0.0.1 (2020-12-04)


### Features

* ✅ add version builder ([30509e7](https://github.com/jscutlery/semver/commit/30509e7153cb524060407b89fd6ef615a939254b))
