import { flushPromises } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { ROUTE_NAMES } from '@/constants/routes'
import { mountApp } from '@tests/helpers/mountApp'

describe('Navigation', () => {
  it('moves between pages with the main navigation and updates the title', async () => {
    const { wrapper, router } = await mountApp('/')
    expect(wrapper.get('h1').text()).toBe('System status')

    const devicesLink = wrapper.findAll('nav a').find((a) => a.text() === 'Devices')
    await devicesLink?.trigger('click')

    // Pages are lazy-loaded, so the route changes a moment after the click.
    await vi.waitFor(() => expect(router.currentRoute.value.name).toBe(ROUTE_NAMES.devices))
    await vi.waitFor(() => expect(wrapper.get('h1').text()).toBe('Devices'))
    expect(document.title).toBe('Devices · Vue Reference App')
  })

  it('shows the not-found page for an unknown address and links back', async () => {
    const { wrapper } = await mountApp('/no/such/page')

    await vi.waitFor(() => expect(wrapper.get('h1').text()).toBe('Page not found'))
    await wrapper.get('main a').trigger('click')
    await flushPromises()

    await vi.waitFor(() => expect(wrapper.get('h1').text()).toBe('System status'))
  })
})
