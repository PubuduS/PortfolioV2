import angular from 'angular-eslint';
import { FlatCompat } from '@eslint/eslintrc';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import js from '@eslint/js';
import nx from '@nx/eslint-plugin';
import eslintPluginImportNewlines from 'eslint-plugin-import-newlines';
import tsEslintPlugin from '@typescript-eslint/eslint-plugin';

const typescriptEslintRules = new Set(Object.keys(tsEslintPlugin.rules));
const renamedTypescriptEslintRules = {
  'no-throw-literal': 'only-throw-error',
  'no-useless-template-literals': 'no-unnecessary-template-expression',
};

function omitRemovedTypescriptEslintRules(configs) {
  return configs.map((config) => {
    if (!config.rules) {
      return config;
    }

    const rules = { ...config.rules };
    for (const ruleName of Object.keys(rules)) {
      const prefix = '@typescript-eslint/';
      if (!ruleName.startsWith(prefix)) {
        continue;
      }

      const shortName = ruleName.slice(prefix.length);
      if (typescriptEslintRules.has(shortName)) {
        continue;
      }

      const renamed = renamedTypescriptEslintRules[shortName];
      if (renamed && typescriptEslintRules.has(renamed)) {
        rules[`${prefix}${renamed}`] = rules[ruleName];
      }
      delete rules[ruleName];
    }

    return { ...config, rules };
  });
}

const rootDir = dirname(fileURLToPath(import.meta.url));

const compat = new FlatCompat({
  baseDirectory: rootDir,
  recommendedConfig: js.configs.recommended,
});

export default [
  ...nx.configs['flat/base'],
  { plugins: { 'import-newlines': eslintPluginImportNewlines } },
  {
    files: ['**/*.ts'],
    languageOptions: {
      parserOptions: {
        parser: '@typescript-eslint/parser',
        project: './tsconfig.base.json',
      },
    },
  },
  ...nx.configs['flat/typescript'],
  ...angular.configs.tsRecommended.map((config) => ({
    ...config,
    files: ['**/*.ts'],
  })),
  {
    files: ['**/*.ts'],
    rules: {
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
      '@angular-eslint/prefer-standalone': 'error',
      '@angular-eslint/prefer-inject': 'off',
    },
  },
  ...omitRemovedTypescriptEslintRules(
    compat
    .config({
      extends: [
        'airbnb-base',
        'airbnb-typescript/base',
        'plugin:import/typescript',
        'plugin:jsdoc/recommended',
      ],
      parserOptions: {
        project: './tsconfig.base.json',
      },
      plugins: ['jasmine', 'import', 'jsdoc'],
      settings: {
        'import/core-modules': ['rxjs/operators'],
        'import/resolver': {
          typescript: {},
        },
      },
      env: {
        es6: true,
        jasmine: true,
        browser: true,
      },
    })
    .map((config) => ({
      ...config,
      files: ['**/*.ts'],
      rules: {
        ...config.rules,
        '@nx/enforce-module-boundaries': [
          'error',
          {
            enforceBuildableLibDependency: false,
            allow: [],
            allowCircularSelfDependency: true,
            checkDynamicDependenciesExceptions: [
              '@portfolio-v2/admin-components',
              '@portfolio-v2/admin-components/**',
              '@portfolio-v2/portfolio-pages',
              '@portfolio-v2/portfolio-pages/**',
              '@portfolio-v2/shared/**',
            ],
            depConstraints: [
              {
                sourceTag: 'type:app',
                onlyDependOnLibsWithTags: [
                  'scope:pages',
                  'scope:admin',
                  'scope:admin-shared',
                  'scope:admin-types',
                  'scope:shared',
                  'scope:state',
                  'scope:domain',
                  'scope:data-access',
                  'scope:environment',
                ],
              },
              {
                sourceTag: 'scope:e2e',
                onlyDependOnLibsWithTags: ['scope:environment', 'scope:tools'],
              },
              {
                sourceTag: 'scope:pages',
                onlyDependOnLibsWithTags: [
                  'scope:shared',
                  'scope:state',
                  'scope:domain',
                  'scope:data-access',
                  'scope:contracts',
                ],
              },
              {
                sourceTag: 'scope:admin',
                onlyDependOnLibsWithTags: [
                  'scope:pages',
                  'scope:admin-shared',
                  'scope:admin-types',
                  'scope:shared',
                  'scope:state',
                  'scope:domain',
                  'scope:data-access',
                  'scope:contracts',
                ],
              },
              {
                sourceTag: 'scope:admin-shared',
                onlyDependOnLibsWithTags: [
                  'scope:admin-types',
                  'scope:shared',
                  'scope:domain',
                ],
              },
              {
                sourceTag: 'scope:admin-types',
                onlyDependOnLibsWithTags: [],
              },
              {
                sourceTag: 'scope:shared',
                onlyDependOnLibsWithTags: [
                  'scope:state',
                  'scope:domain',
                  'scope:data-access',
                  'scope:environment',
                ],
              },
              {
                sourceTag: 'scope:state',
                onlyDependOnLibsWithTags: ['scope:domain', 'scope:data-access'],
              },
              {
                sourceTag: 'scope:data-access',
                onlyDependOnLibsWithTags: ['scope:domain'],
              },
              {
                sourceTag: 'scope:domain',
                onlyDependOnLibsWithTags: [],
              },
              {
                sourceTag: 'scope:contracts',
                onlyDependOnLibsWithTags: [],
              },
              {
                sourceTag: 'scope:environment',
                onlyDependOnLibsWithTags: [],
              },
              {
                sourceTag: 'scope:tools',
                onlyDependOnLibsWithTags: ['scope:domain'],
              },
              {
                sourceTag: 'scope:functions',
                onlyDependOnLibsWithTags: [],
              },
            ],
          },
        ],
        '@typescript-eslint/dot-notation': 'off',
        '@typescript-eslint/explicit-function-return-type': [
          'error',
          {
            allowExpressions: true,
            allowTypedFunctionExpressions: true,
          },
        ],
        '@typescript-eslint/explicit-member-accessibility': [
          'error',
          {
            accessibility: 'explicit',
            overrides: {
              constructors: 'no-public',
            },
          },
        ],
        '@typescript-eslint/no-empty-function': ['off'],
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-non-null-assertion': ['off'],
        '@typescript-eslint/no-restricted-imports': [
          'error',
          {
            patterns: ['**/apps/*'],
          },
        ],
        '@typescript-eslint/no-unused-vars': [
          'error',
          {
            argsIgnorePattern: '^_',
            caughtErrorsIgnorePattern: '^_',
          },
        ],
        '@typescript-eslint/no-useless-constructor': 'off',
        'class-methods-use-this': 'off',
        'import/no-cycle': 2,
        'import/order': [
          'error',
          {
            groups: [
              ['builtin', 'external'],
              ['internal', 'parent', 'sibling'],
            ],
            pathGroups: [
              {
                pattern: '@portfolio-v2/**',
                group: 'internal',
                position: 'before',
              },
            ],
            distinctGroup: false,
            'newlines-between': 'always',
            pathGroupsExcludedImportTypes: [],
          },
        ],
        'max-classes-per-file': 'off',
        'no-empty-function': ['off'],
        'no-param-reassign': [
          'error',
          {
            props: false,
          },
        ],
        'no-return-assign': 'off',
        'no-unused-vars': 'off',
        'operator-linebreak': 'off',
        'import-newlines/enforce': [
          'error',
          {
            items: 1,
            semi: false,
          },
        ],
        'import/no-extraneous-dependencies': [
          'error',
          {
            devDependencies: true,
            optionalDependencies: false,
            peerDependencies: false,
            packageDir: [rootDir],
          },
        ],
        'import/prefer-default-export': 'off',
        'jsdoc/check-tag-names': [
          1,
          {
            definedTags: ['note'],
          },
        ],
        'jsdoc/require-jsdoc': [
          1,
          {
            publicOnly: true,
            require: {
              ArrowFunctionExpression: true,
              ClassDeclaration: true,
              ClassExpression: true,
              FunctionDeclaration: true,
              FunctionExpression: true,
              MethodDefinition: true,
            },
          },
        ],
        'jsdoc/require-param-type': 'off',
        'jsdoc/require-property-type': 'off',
        'jsdoc/require-returns-type': 'off',
        'no-warning-comments': [
          'error',
          {
            terms: ['todo'],
          },
        ],
        'no-extra-semi': 'off',
      },
    })),
  ),
  ...angular.configs.templateRecommended.map((c) => ({
    ...c,
    files: ['**/*.html'],
  })),
  ...compat
    .config({ extends: ['plugin:prettier/recommended'] })
    .map((config) => ({
      ...config,
      files: ['**/*.html'],
      rules: {
        ...config.rules,
      },
    })),
  ...compat
    .config({
      env: {
        jest: true,
      },
    })
    .map((config) => ({
      ...config,
      files: ['**/*.spec.ts', '**/*.spec.tsx', '**/*.spec.js', '**/*.spec.jsx'],
      rules: {
        ...config.rules,
      },
    })),
  {
    ignores: [
      'node_modules/**',
      'dist/',
      'release/',
      '**/*.js',
      'node_modules/**',
      'documentation/**',
      '# apps/portfolio-v2-e2e/**/*.cy.ts',
      '# apps/portfolio-v2-e2e/src/support/app.po.ts',
      '# apps/portfolio-v2-e2e/src/support/commands.ts',
    ],
  },
];
