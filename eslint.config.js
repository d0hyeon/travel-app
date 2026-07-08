import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'

import packageImport from './tools/eslint/package-import.js'

import {
  defineConfig,
  globalIgnores,
} from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', 'dev-dist', '.react-router']),
  {
    files: ['**/*.{ts,tsx}'],

    plugins: {
      package: {
        rules: {
          import: packageImport,
        },
      },
    },

    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
    ],

    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },

    rules: {
      'package/import': ['error', { aliases: { '~': './src' }}],
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/refs': 'off',
      '@typescript-eslint/no-explicit-any': ['warn', { ignoreRestArgs: true }],
      "@typescript-eslint/no-unsafe-function-type": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "no-async-promise-executor": "off",
      "@typescript-eslint/ban-ts-comment": "off"
    },
  },
])