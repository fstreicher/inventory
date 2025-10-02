import pluginJs from '@eslint/js';
import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';
import ngEslint from 'angular-eslint';

/** @type {import('eslint').Linter.Config[]} */
export default defineConfig(
  // Global ignores first
  {
    ignores: [
      'eslint.config.mjs',
      '**/*spec.ts',
      'dist/**',
      '.angular/**',
      'node_modules/**',
      'public/**', // Ignore service worker and other public assets
    ],
  },

  // Base JavaScript configuration only
  pluginJs.configs.recommended,

  // TypeScript files configuration
  {
    files: ['**/*.ts'],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    extends: [
      ...tseslint.configs.recommendedTypeChecked,
      ...ngEslint.configs.tsRecommended,
    ],
    rules: {
      'function-paren-newline': ['warn', 'consistent'],
      'no-console': ['warn', { allow: ['debug', 'warn', 'error'] }],
      'no-warning-comments': 'warn',
      'object-shorthand': 'warn',
      'prefer-template': 'warn',

      // TypeScript-specific rules
      '@typescript-eslint/array-type': ['warn', { default: 'generic' }],
      '@typescript-eslint/default-param-last': 'error',
      '@typescript-eslint/explicit-function-return-type': 'error',

      // Enforce explicit member accessibility (aligns with your # private field preference)
      '@typescript-eslint/explicit-member-accessibility': [
        'error',
        {
          accessibility: 'explicit',
          overrides: {
            constructors: 'no-public',
          },
        }
      ],

      '@typescript-eslint/no-empty-interface': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-floating-promises': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          varsIgnorePattern: '^_',
          argsIgnorePattern: '^_',
        }
      ],
      '@typescript-eslint/no-shadow': 'error',
      '@typescript-eslint/prefer-optional-chain': 'warn',
      '@typescript-eslint/unbound-method': 'off',

      // Additional rules for your coding standards
      '@typescript-eslint/prefer-readonly': 'warn',
      '@typescript-eslint/consistent-type-definitions': ['error', 'type'],
      '@typescript-eslint/member-ordering': [
        'warn',
        {
          default: [
            // Private fields first (matches your # preference)
            'private-field',
            'protected-field',
            'public-field',
            'constructor',
            // 'private-method',
            // 'protected-method',
            // 'public-method',
          ]
        }
      ],

      // Angular-specific rules (conservative set for v20+)
      '@angular-eslint/component-class-suffix': 'error',
      '@angular-eslint/directive-class-suffix': 'error',
      '@angular-eslint/use-lifecycle-interface': 'error',
    }
  },

  // HTML template files configuration
  {
    files: ['**/*.html'],
    extends: [
      ...ngEslint.configs.templateRecommended,
    ],
    rules: {
      // Template-specific rules only
      '@angular-eslint/template/attributes-order': [
        'warn',
        {
          alphabetical: true,
          order: [
            'STRUCTURAL_DIRECTIVE',
            'TEMPLATE_REFERENCE',
            'ATTRIBUTE_BINDING',
            'INPUT_BINDING',
            'TWO_WAY_BINDING',
            'OUTPUT_BINDING',
          ]
        }
      ],
      '@angular-eslint/template/prefer-self-closing-tags': 'error',
      '@angular-eslint/template/no-duplicate-attributes': 'error',
      '@angular-eslint/template/banana-in-box': 'error',
      '@angular-eslint/template/no-negated-async': 'error',
    }
  }
);