// Mutation testing: Stryker changes the source in small ways (e.g. `>` to `>=`) and checks that a test fails.
// A surviving mutant means the tests would not notice that bug.
/** @type {import('@stryker-mutator/api/core').PartialStrykerOptions} */
export default {
  testRunner: 'vitest',
  vitest: { configFile: 'vitest.config.ts' },
  mutate: [
    'src/**/*.ts',
    '!src/**/*.spec.ts',
    '!src/**/*.d.ts',
    '!src/main.ts',
    '!src/types/**',
    '!src/constants/**',
  ],
  coverageAnalysis: 'perTest',
  reporters: ['clear-text', 'progress', 'html'],
  htmlReporter: { fileName: 'reports/mutation/index.html' },
  tempDirName: '.stryker-tmp',
  thresholds: { high: 85, low: 70, break: 60 },
}
