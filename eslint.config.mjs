import { defineConfig } from 'eslint-define-config';
import importPlugin from 'eslint-plugin-import';
import prettierConfig from 'eslint-config-prettier';
import prettierPlugin from 'eslint-plugin-prettier';

export default defineConfig([
  {
    files: ['**/*.mjs'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    plugins: {
      import: importPlugin,
      prettier: prettierPlugin,
    },
    rules: {
      'no-unused-vars': 'warn',
      'no-console': 'off',

      'import/order': 'warn',
      'import/no-unresolved': 'error',

      'prettier/prettier': 'warn',
    },
    ignores: ['node_modules/'],
  },
  prettierConfig,
]);
