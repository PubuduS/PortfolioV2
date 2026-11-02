import { dirname } from 'path';
import { fileURLToPath } from 'url';
import baseConfig from '../../../eslint.config.mjs';
import nx from '@nx/eslint-plugin';

export default [
  ...baseConfig,
  {
    files: ['**/*.ts'],
    languageOptions: {
      parserOptions: {
        project: ['libs/admin/admin-components/tsconfig.*?.json'],
        createDefaultProgram: true,
      },
    },
  },
  ...nx.configs['flat/angular'],
  {
    files: ['**/*.ts'],
    rules: {
      '@angular-eslint/directive-selector': [
        'error',
        {
          type: 'attribute',
          prefix: 'admin',
          style: 'camelCase',
        },
      ],
      '@angular-eslint/component-selector': [
        'error',
        {
          type: 'element',
          prefix: 'admin',
          style: 'kebab-case',
        },
      ],
      '@angular-eslint/prefer-standalone': 'error',
      '@angular-eslint/prefer-inject': 'off',
    },
  },
];
