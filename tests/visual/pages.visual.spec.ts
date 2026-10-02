import { expect, test } from '@playwright/test'
import { resetBackend } from '../helpers/backend'

// Visual regression: compares screenshots with the committed baselines in e2e/visual/*-snapshots/.
// Baselines depend on the OS and fonts, so create them where CI runs: `npm run test:visual:update`.
test.describe('Visual regression', () => {
  test.beforeEach(async ({ request }) => {
    await resetBackend(request)
  })

  test('status page', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByTestId('heartbeat-indicator')).toHaveText('Online')

    await expect(page).toHaveScreenshot('status-page.png', {
      // The "last checked" time changes on every run.
      mask: [page.getByTestId('last-checked')],
    })
  })

  test('devices page', async ({ page }) => {
    await page.goto('/devices')
    await expect(page.locator('tbody tr')).toHaveCount(3)

    await expect(page).toHaveScreenshot('devices-page.png')
  })

  test('devices page when the API fails', async ({ page }) => {
    await page.route('**/api/devices', (route) =>
      route.fulfill({ status: 500, json: { message: 'Database is down' } }),
    )
    await page.goto('/devices')
    await expect(page.getByRole('alert')).toBeVisible()

    await expect(page).toHaveScreenshot('devices-error.png')
  })

  test('add device dialog with validation errors', async ({ page }) => {
    await page.goto('/devices')
    await page.getByRole('button', { name: 'Add device' }).click()
    await page
      .getByRole('dialog', { name: 'Add device' })
      .getByRole('button', { name: 'Add device' })
      .click()
    await expect(page.getByText('Name must be at least 3 characters')).toBeVisible()

    await expect(page).toHaveScreenshot('add-device-dialog-errors.png')
  })

  test('delete confirmation dialog', async ({ page }) => {
    await page.goto('/devices')
    await page.getByRole('button', { name: 'Delete Core Switch' }).click()
    await expect(page.getByRole('dialog', { name: 'Delete device' })).toBeVisible()

    await expect(page).toHaveScreenshot('delete-dialog.png')
  })
})
