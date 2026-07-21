module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',     // New feature
        'fix',      // Bug fix
        'docs',     // Documentation
        'style',    // Formatting (no code change)
        'refactor', // Code restructuring
        'perf',     // Performance improvement
        'test',     // Adding tests
        'build',    // Build system
        'ci',       // CI configuration
        'chore',    // Maintenance
        'revert',   // Revert commit
        'security', // Security fix
      ],
    ],
    'type-case': [2, 'always', 'lower-case'],
    'type-empty': [2, 'never'],
    'subject-empty': [2, 'never'],
    'subject-full-stop': [2, 'never', '.'],
    'subject-case': [0], // Allow any case
    'header-max-length': [2, 'always', 100],
    'body-max-line-length': [0], // No limit
  },
};
