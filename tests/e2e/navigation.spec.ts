import { expect, test } from '@playwright/test'

test.describe('Navigation', () => {
  test('moves between pages and keeps the title in sync', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle('Status · Vue Reference App')

    await page
      .getByRole('navigation', { name: 'Main' })
      .getByRole('link', { name: 'Devices' })
      .click()

    await expect(page).toHaveURL(/\/devices$/)
    await expect(page.getByRole('heading', { name: 'Devices' })).toBeVisible()
    await expect(page).toHaveTitle('Devices · Vue Reference App')
  })

  test('shows a not-found page for an unknown address', async ({ page }) => {
    await page.goto('/no/such/page')

    await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible()
    await page.getByRole('link', { name: 'Back to status' }).click()
    await expect(page.getByRole('heading', { name: 'System status' })).toBeVisible()
  })
})
