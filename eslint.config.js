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
  globalIgnores(['dist']),
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
      'package/import': 'error',
      // 외부 명령형 시스템(지도 SDK) 인스턴스를 effect에서 state로 끌어올려야 하는
      // 정당한 케이스가 있어 error 대신 warning으로 둔다.
      'react-hooks/set-state-in-effect': 'warn',
    },
  },
])