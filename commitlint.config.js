module.exports = {
  extends: ['@commitlint/config-angular'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'ci',
        'docs',
        'feat',
        'fix',
        'perf',
        'refactor',
        'revert',
        'test',
        'wip',
        'chore',
      ],
    ],
    'scope-enum': [
      2,
      'always',
      ['semver', 'github']
    ]
  },
};
