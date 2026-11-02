import baseConfig from '../../eslint.config.mjs';

export default [
  ...baseConfig,
  {
    files: ['**/*.ts'],
    // Override or add rules here
    rules: {},
    languageOptions: {
      parserOptions: {
        project: ['apps/portfolio-v2-e2e/tsconfig.json'],
      },
    },
  },
];
