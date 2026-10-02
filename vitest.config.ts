import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config'

// Dates are formatted in the local time zone; pin it so tests give the same result everywhere.
process.env.TZ = 'UTC'

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'jsdom',
      setupFiles: ['./tests/setup/vitest.setup.ts'],

      // Hygiene: tests must not leak state into each other.
      mockReset: true,
      restoreMocks: true,
      unstubGlobals: true,
      unstubEnvs: true,
      sequence: { shuffle: true },

      // Guard rails: a stray .only, an empty suite, or an assertion-free test fails the run.
      allowOnly: false,
      passWithNoTests: false,
      expect: { requireAssertions: true },

      reporters: ['default', 'junit'],
      outputFile: { junit: './test-results/vitest-junit.xml' },

      // One config, three runnable suites: `npm run test:unit | test:integration | test:contract`.
      projects: [
        { extends: true, test: { name: 'unit', include: ['src/**/*.spec.ts'] } },
        {
          extends: true,
          test: { name: 'integration', include: ['tests/integration/**/*.spec.ts'] },
        },
        { extends: true, test: { name: 'contract', include: ['tests/contract/**/*.spec.ts'] } },
      ],

      coverage: {
        provider: 'v8',
        reporter: ['text', 'html', 'json-summary', 'cobertura'],
        reportsDirectory: './coverage',
        reportOnFailure: true,
        include: ['src/**/*.{ts,vue}'],
        exclude: ['src/main.ts', 'src/**/*.spec.ts', 'src/**/*.d.ts'],
        thresholds: {
          lines: 90,
          statements: 90,
          functions: 90,
          branches: 85,
        },
      },
    },
  }),
)
