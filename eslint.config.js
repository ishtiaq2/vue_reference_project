import js from '@eslint/js'
import vitest from '@vitest/eslint-plugin'
import { defineConfig, globalIgnores } from 'eslint/config'
import prettier from 'eslint-config-prettier/flat'
import playwright from 'eslint-plugin-playwright'
import pluginVue from 'eslint-plugin-vue'
import globals from 'globals'
import tseslint from 'typescript-eslint'

/** Import-direction rules: lower layers must never import from higher ones. */
const layer = (...patterns) => ({
  patterns: patterns.map((pattern) => ({
    group: [pattern],
    message: 'Layer violation: see docs/ARCHITECTURE.md (dependency rules).',
  })),
})
// `**/` makes the patterns match both `@/stores/x` and relative `../stores/x` imports.
const UI = ['**/views/*', '**/components/*']
const STATE = ['**/stores/*']
const DATA = ['**/services/*']
const COMPOSABLES = ['**/composables/*']
const MODELS = ['**/models/*']
const HTTP = ['**/infrastructure/http/*'] // only services talk to the network
const INFRASTRUCTURE = ['**/infrastructure/*']

/** Playwright suites; they use `test`/`expect` from @playwright/test, not Vitest. */
const PLAYWRIGHT_FILES = ['tests/api/**/*.ts', 'tests/e2e/**/*.ts', 'tests/visual/**/*.ts']

export default defineConfig(
  globalIgnores([
    'dist/**',
    'coverage/**',
    'test-results/**',
    'playwright-report/**',
    'reports/**',
    '.stryker-tmp/**',
  ]),

  js.configs.recommended,
  tseslint.configs.strict,
  pluginVue.configs['flat/recommended'],

  {
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
      'vue/block-lang': ['error', { script: { lang: 'ts' } }],
      'vue/define-props-declaration': ['error', 'type-based'],
      'vue/define-emits-declaration': ['error', 'type-based'],
      'vue/multi-word-component-names': 'error',
    },
  },
  { files: ['**/*.vue'], languageOptions: { parserOptions: { parser: tseslint.parser } } },

  // Architecture: enforced by lint instead of by code review.
  {
    files: ['src/views/**/*.{ts,vue}'],
    rules: { 'no-restricted-imports': ['error', layer(...DATA, ...HTTP)] },
  },
  {
    files: ['src/components/**/*.{ts,vue}'],
    rules: {
      'no-restricted-imports': ['error', layer(...STATE, ...DATA, ...HTTP, '**/views/*')],
    },
  },
  {
    files: ['src/stores/**/*.ts'],
    rules: { 'no-restricted-imports': ['error', layer(...UI, ...HTTP)] },
  },
  {
    files: ['src/composables/**/*.ts'],
    rules: { 'no-restricted-imports': ['error', layer(...UI, ...STATE, ...DATA, ...HTTP)] },
  },
  {
    files: ['src/services/**/*.ts'],
    rules: { 'no-restricted-imports': ['error', layer(...UI, ...STATE, ...COMPOSABLES)] },
  },
  {
    files: ['src/infrastructure/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        layer(...UI, ...STATE, ...DATA, ...COMPOSABLES, ...MODELS),
      ],
    },
  },
  {
    files: ['src/{models,types,utils,constants}/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        layer(...UI, ...STATE, ...DATA, ...COMPOSABLES, ...INFRASTRUCTURE),
      ],
    },
  },

  // Tests: Vitest rules for unit, integration, contract and shared test code...
  {
    files: ['src/**/*.spec.ts', 'tests/**/*.ts'],
    ignores: PLAYWRIGHT_FILES,
    plugins: { vitest },
    rules: {
      ...vitest.configs.recommended.rules,
      'vitest/expect-expect': 'error',
      'vitest/no-focused-tests': 'error',
      'vitest/no-disabled-tests': 'error',
      'vitest/no-identical-title': 'error',
      'vitest/consistent-test-it': ['error', { fn: 'it' }],
    },
  },

  // ...and Playwright rules for the API, browser and visual suites.
  {
    ...playwright.configs['flat/recommended'],
    files: PLAYWRIGHT_FILES,
  },

  prettier,
)
