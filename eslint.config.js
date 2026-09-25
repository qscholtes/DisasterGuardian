const expoConfig = require('eslint-config-expo/flat');
const { defineConfig } = require('eslint/config');

module.exports = defineConfig([
  {
    ignores: ['android/**', 'dist/**', '.expo/**', 'node_modules/**'],
  },
  expoConfig,
  {
    files: ['**/*.{js,jsx}'],
    rules: {
      // Existing screens contain deliberate platform callbacks and JSX helpers, so keep these as review warnings.
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-console': 'warn',
    },
  },
  {
    files: ['tests/**/*.js'],
    languageOptions: {
      globals: {
        afterEach: 'readonly',
        beforeEach: 'readonly',
        describe: 'readonly',
        expect: 'readonly',
        jest: 'readonly',
        test: 'readonly',
      },
    },
  },
]);
