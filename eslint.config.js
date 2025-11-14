import js from '@eslint/js';
import pluginQuasar from '@quasar/app-vite/eslint';
import prettierSkipFormatting from '@vue/eslint-config-prettier/skip-formatting';
import {
  defineConfigWithVueTs,
  vueTsConfigs,
} from '@vue/eslint-config-typescript';
import jsdoc from 'eslint-plugin-jsdoc';
import vue from 'eslint-plugin-vue';
import globals from 'globals';

export default defineConfigWithVueTs(
  {
    ignores: [
      'dist/',
      'coverage/',
      '**/vite.config.*.timestamp*',
      '**/vitest.config.*.timestamp*',
      '.__mf__temp/',
      '**/__mf__temp/',
      'src/router/routes.ts',
      'src/router/index.ts',
    ],
  },
  pluginQuasar.configs.recommended(),
  js.configs.recommended,
  vueTsConfigs.recommended,
  vue.configs['flat/recommended'],
  jsdoc.configs['flat/recommended-typescript'],
  prettierSkipFormatting,
  {
    files: ['**/*.{js,mjs,cjs}'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node, // SSR, Electron, config files
        process: 'readonly',
        ga: 'readonly', // Google Analytics
        cordova: 'readonly',
        Capacitor: 'readonly',
        chrome: 'readonly', // BEX related
        browser: 'readonly', // BEX related
      },
    },
  },
  {
    files: ['**/*.{js,mjs,cjs,ts,vue}'],
    rules: {
      // Vue rules
      'vue/multi-word-component-names': 'off',
      'vue/require-default-prop': 'error',
      'vue/require-prop-types': 'error',
      'vue/component-api-style': ['error', ['script-setup']],
      'vue/max-attributes-per-line': 'error',

      // TypeScript rules
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/consistent-type-imports': 'error',

      // JSDoc rules
      'jsdoc/require-jsdoc': [
        'error',
        {
          require: {
            ArrowFunctionExpression: true,
            ClassDeclaration: true,
            ClassExpression: true,
            FunctionExpression: true,
            MethodDefinition: true,
          },
          contexts: [
            'TSPropertySignature',
            'TSInterfaceDeclaration',
            'TSTypeAliasDeclaration',
            'TSEnumDeclaration',
            'TSModuleDeclaration VariableDeclaration',
          ],
        },
      ],
      'jsdoc/check-tag-names': 'error',
      'jsdoc/check-types': 'error',
      'jsdoc/check-param-names': 'error',
      'jsdoc/require-description': 'warn',
      'jsdoc/require-description-complete-sentence': 'error',

      // General rules
      'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
      'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
      curly: 'error',
    },
  },
  {
    files: [
      '**/*.test.ts',
      '**/*.spec.ts',
      '**/__tests__/**',
      '**/*.config.*',
      '**/*.config.*',
    ],
    rules: {
      'jsdoc/require-jsdoc': 'off',
    },
  },
  {
    files: ['src-pwa/custom-service-worker.ts'],
    languageOptions: {
      globals: {
        ...globals.serviceworker,
      },
    },
  }
);
