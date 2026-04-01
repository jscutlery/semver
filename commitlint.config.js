module.exports = {
  extends: ['@commitlint/config-angular'],
  rules: {
    'header-max-length': [2, 'always', 120],
    'scope-enum': [2, 'always', ['semver']],
    'type-enum': [
      2,
      'always',
      [
        'build',
        'ci',
        'docs',
        'feat',
        'fix',
        'perf',
        'refactor',
        'revert',
        'style',
        'test',
        'release',
        'wip',
        'chore',
      ],
    ],
  },
};
