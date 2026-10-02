import { expect, test } from '@playwright/test'
import { resetBackend } from '../helpers/backend'

// E2E: a real browser against the built app and the (mock) backend. Few tests, whole user journeys.
test.describe('Devices page', () => {
  test.beforeEach(async ({ request, page }) => {
    await resetBackend(request)
    await page.goto('/devices')
  })

  test('lists the devices from the backend', async ({ page }) => {
    await expect(page.getByRole('table', { name: 'Devices' })).toBeVisible()
    await expect(page.locator('tbody tr')).toHaveCount(3)
    await expect(page.getByText('3 devices, 2 online')).toBeVisible()
    await expect(page.getByRole('row', { name: /Branch Gateway.*Offline/ })).toBeVisible()
  })

  test('adds a device through the dialog', async ({ page }) => {
    await page.getByRole('button', { name: 'Add device' }).click()
    const dialog = page.getByRole('dialog', { name: 'Add device' })
    await dialog.getByLabel('Name').fill('Lab Router')
    await dialog.getByLabel('Firmware version').fill('1.0.0')
    await dialog.getByRole('button', { name: 'Add device' }).click()

    await expect(dialog).toBeHidden()
    await expect(page.getByRole('row', { name: /Lab Router/ })).toBeVisible()
    await expect(page.getByText('4 devices, 2 online')).toBeVisible()
  })

  test('validates the form in the browser without calling the API', async ({ page }) => {
    const posts: string[] = []
    page.on('request', (request) => {
      if (request.method() === 'POST') posts.push(request.url())
    })

    await page.getByRole('button', { name: 'Add device' }).click()
    const dialog = page.getByRole('dialog', { name: 'Add device' })
    await dialog.getByRole('button', { name: 'Add device' }).click()

    await expect(dialog.getByText('Name must be at least 3 characters')).toBeVisible()
    await expect(dialog.getByText('Firmware version must look like 1.2.3')).toBeVisible()
    expect(posts).toEqual([])
  })

  test('shows the error from the server when the name is already taken', async ({ page }) => {
    await page.getByRole('button', { name: 'Add device' }).click()
    const dialog = page.getByRole('dialog', { name: 'Add device' })
    await dialog.getByLabel('Name').fill('Edge Router 1')
    await dialog.getByLabel('Firmware version').fill('1.0.0')
    await dialog.getByRole('button', { name: 'Add device' }).click()

    await expect(dialog.getByRole('alert')).toHaveText(
      'A device named "Edge Router 1" already exists',
    )
    await expect(dialog).toBeVisible()
  })

  test('closes the dialog with Escape', async ({ page }) => {
    await page.getByRole('button', { name: 'Add device' }).click()
    const dialog = page.getByRole('dialog', { name: 'Add device' })
    await expect(dialog).toBeVisible()

    await page.keyboard.press('Escape')

    await expect(dialog).toBeHidden()
  })

  test('closes the dialog when the backdrop is clicked', async ({ page }) => {
    await page.getByRole('button', { name: 'Add device' }).click()
    const dialog = page.getByRole('dialog', { name: 'Add device' })
    await expect(dialog).toBeVisible()

    await page.mouse.click(5, 5)

    await expect(dialog).toBeHidden()
  })

  test('keeps keyboard focus away from the page behind the open dialog', async ({ page }) => {
    await page.getByRole('button', { name: 'Add device' }).click()
    const dialog = page.getByRole('dialog', { name: 'Add device' })

    // Tab past every control twice. A modal <dialog> makes the page behind it inert: focus stays on
    // the dialog's own controls or moves to the browser UI (reported as <body>), never to the nav,
    // the table or the "Add device" button behind it.
    for (let i = 0; i < 12; i++) {
      await page.keyboard.press('Tab')
      const where = await dialog.evaluate((el) => {
        const active = document.activeElement
        if (active === document.body) return 'browser-ui'
        return el.contains(active) ? 'dialog' : 'page-behind'
      })
      expect(where).not.toBe('page-behind')
    }
  })

  test('gives focus back to the button that opened the dialog', async ({ page }) => {
    const opener = page.getByRole('button', { name: 'Add device' })
    await opener.click()
    await expect(page.getByRole('dialog', { name: 'Add device' })).toBeVisible()

    await page.keyboard.press('Escape')

    await expect(opener).toBeFocused()
  })

  test('deletes a device after confirmation', async ({ page }) => {
    await page.getByRole('button', { name: 'Delete Core Switch' }).click()
    const dialog = page.getByRole('dialog', { name: 'Delete device' })
    await expect(dialog).toContainText('Delete Core Switch?')
    await dialog.getByRole('button', { name: 'Delete' }).click()

    await expect(dialog).toBeHidden()
    await expect(page.getByRole('row', { name: /Core Switch/ })).toHaveCount(0)
    await expect(page.getByText('2 devices, 1 online')).toBeVisible()
  })

  test('keeps the device when the deletion is cancelled', async ({ page }) => {
    await page.getByRole('button', { name: 'Delete Core Switch' }).click()
    await page
      .getByRole('dialog', { name: 'Delete device' })
      .getByRole('button', { name: 'Cancel' })
      .click()

    await expect(page.locator('tbody tr')).toHaveCount(3)
  })

  test('shows an error with a retry button when the API fails, then recovers', async ({ page }) => {
    // Break only the next request; the retry goes through to the real backend.
    await page.route(
      '**/api/devices',
      (route) => route.fulfill({ status: 500, json: { message: 'Database is down' } }),
      { times: 1 },
    )
    await page.reload()

    await expect(page.getByRole('alert')).toContainText('Database is down')
    await page.getByRole('button', { name: 'Retry' }).click()

    await expect(page.locator('tbody tr')).toHaveCount(3)
  })
})
