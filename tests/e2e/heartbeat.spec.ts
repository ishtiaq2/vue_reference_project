import { expect, test } from '@playwright/test'

// The e2e web server polls every 500 ms (see playwright.config.ts) so these tests stay fast.
test.describe('Heartbeat', () => {
  test('shows the server as online and its version', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByTestId('heartbeat-indicator')).toHaveText('Online')
    await expect(page.getByTestId('server-version')).toHaveText('1.0.0')
  })

  test('shows the server as offline when the API stops answering, and recovers', async ({
    page,
  }) => {
    await page.route('**/api/heartbeat', (route) =>
      route.fulfill({ status: 503, json: { message: 'Service unavailable' } }),
    )
    await page.goto('/')

    await expect(page.getByTestId('heartbeat-indicator')).toHaveText('Offline')
    await expect(page.getByRole('alert')).toHaveText('Service unavailable')

    await page.unroute('**/api/heartbeat')

    await expect(page.getByTestId('heartbeat-indicator')).toHaveText('Online')
  })

  test('"Check now" refreshes the status immediately', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByTestId('heartbeat-indicator')).toHaveText('Online')

    const request = page.waitForRequest('**/api/heartbeat')
    await page.getByRole('button', { name: 'Check now' }).click()

    await request
  })
})
