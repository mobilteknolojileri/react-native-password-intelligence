import { fixupConfigRules } from '@eslint/compat';
import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';
import prettier from 'eslint-plugin-prettier';
import { defineConfig } from 'eslint/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

export default defineConfig([
  {
    extends: fixupConfigRules(compat.extends('@react-native', 'prettier')),
    plugins: { prettier },
    rules: {
      'react/react-in-jsx-scope': 'off',
      'prettier/prettier': 'error',
    },
  },
  {
    // The wrapper must never import @zxcvbn-ts directly: two copies of
    // @zxcvbn-ts/core means configure() writes to one module-level
    // zxcvbnOptions singleton while analyzePassword reads from another.
    files: ['packages/react-native/src/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@zxcvbn-ts/*'],
              message:
                'Import from "password-intelligence" instead — the wrapper must not pull in a second @zxcvbn-ts/core instance.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['**/*.mjs'],
    languageOptions: { sourceType: 'module', ecmaVersion: 'latest' },
  },
  {
    // TypeScript's noPropertyAccessFromIndexSignature REQUIRES bracket access
    // on index signatures, which is exactly what dot-notation flags.
    files: ['**/*.ts', '**/*.tsx'],
    rules: { 'dot-notation': 'off' },
  },
  {
    ignores: [
      '**/node_modules/**',
      '.yarn/**',
      '**/lib/**',
      'coverage/**',
      'example/**',
      'packages/core/src/data/*.generated.ts',
    ],
  },
]);
