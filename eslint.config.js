// @ts-check
const eslintKey = require('typescript-eslint');
const angular = require('angular-eslint');
const eslintPluginPrettierRecommended = require('eslint-plugin-prettier/recommended');
const tseslint = require('typescript-eslint');

module.exports = eslintKey.config(
  {
    files: ['**/*.ts'],
    extends: [
      eslintKey.configs.recommended,
      eslintKey.configs.stylistic,
      ...angular.configs.tsRecommended,
      eslintPluginPrettierRecommended,
      tseslint.configs.recommended,
    ],
    processor: angular.processInlineTemplates,
    rules: {
      '@typescript-eslint/explicit-member-accessibility': 'error',
      '@angular-eslint/directive-selector': [
        'error',
        {
          type: 'attribute',
          prefix: 'app',
          style: 'camelCase',
        },
      ],
      '@angular-eslint/component-selector': [
        'error',
        {
          type: 'element',
          prefix: 'app',
          style: 'kebab-case',
        },
      ],
    },
  },
  {
    files: ['**/*.html'],
    extends: [
      ...angular.configs.templateRecommended,
      ...angular.configs.templateAccessibility,
      eslintPluginPrettierRecommended,
    ],
    rules: {},
  },
);
