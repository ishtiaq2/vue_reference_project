import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'
import { resetBackend } from '../helpers/backend'

async function expectNoViolations(page: Page): Promise<void> {
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()
  expect(results.violations).toEqual([])
}

test.describe('Accessibility (axe-core, WCAG 2 A/AA)', () => {
  test.beforeEach(async ({ request }) => {
    await resetBackend(request)
  })

  test('status page', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByTestId('heartbeat-indicator')).toHaveText('Online')

    await expectNoViolations(page)
  })

  test('devices page', async ({ page }) => {
    await page.goto('/devices')
    await expect(page.locator('tbody tr')).toHaveCount(3)

    await expectNoViolations(page)
  })

  test('add device dialog, including validation errors', async ({ page }) => {
    await page.goto('/devices')
    await page.getByRole('button', { name: 'Add device' }).click()
    const dialog = page.getByRole('dialog', { name: 'Add device' })
    await dialog.getByRole('button', { name: 'Add device' }).click()
    await expect(dialog.getByText('Name must be at least 3 characters')).toBeVisible()

    await expectNoViolations(page)
  })

  test('confirm dialog', async ({ page }) => {
    await page.goto('/devices')
    await page.getByRole('button', { name: 'Delete Core Switch' }).click()
    await expect(page.getByRole('dialog', { name: 'Delete device' })).toBeVisible()

    await expectNoViolations(page)
  })
})
