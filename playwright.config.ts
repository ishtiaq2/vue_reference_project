import { defineConfig, devices } from '@playwright/test'

const PORT = 4173
const BASE_URL = process.env['BASE_URL'] ?? `http://127.0.0.1:${PORT}`

export default defineConfig({
  testDir: './tests',
  // The mock backend keeps state in memory, so tests run one at a time and reset it first.
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env['CI']),
  retries: process.env['CI'] ? 2 : 0,
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
    ['junit', { outputFile: 'test-results/playwright-junit.xml' }],
  ],
  outputDir: 'test-results/playwright',
  // Visual baselines live next to the visual specs: tests/visual/__snapshots__/<spec file>/<name>-<platform>.png
  snapshotPathTemplate: '{testDir}/__snapshots__/{testFileName}/{arg}{-snapshotSuffix}{ext}',

  use: {
    baseURL: BASE_URL,
    // Fixed locale and time zone so formatted dates are identical on every machine.
    locale: 'en-GB',
    timezoneId: 'UTC',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },

  expect: {
    // A tiny absolute budget absorbs anti-aliasing noise but still catches a changed colour, border
    // or layout. (A ratio such as 1% of a 1280x800 page is ~10,000 pixels: a whole button could change.)
    toHaveScreenshot: { maxDiffPixels: 50, animations: 'disabled' },
  },

  projects: [
    // API tests: HTTP only, no browser. Point BASE_URL at any environment to run them there.
    { name: 'api', testDir: './tests/api' },
    { name: 'e2e', testDir: './tests/e2e', use: { ...devices['Desktop Chrome'] } },
    {
      name: 'visual',
      testDir: './tests/visual',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } },
    },
  ],

  // Skipped when BASE_URL is set (testing an already running environment).
  ...(process.env['BASE_URL']
    ? {}
    : {
        webServer: {
          command: `vite build && vite preview --host 127.0.0.1 --port ${PORT} --strictPort`,
          url: BASE_URL,
          reuseExistingServer: !process.env['CI'],
          timeout: 120_000,
          // Poll fast so the "backend goes down" test finishes in seconds.
          env: { VITE_HEARTBEAT_INTERVAL_MS: '500' },
        },
      }),
})
