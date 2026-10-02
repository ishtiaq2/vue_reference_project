import { createTestingPinia } from '@pinia/testing'
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { useHeartbeatStore } from '@/stores/heartbeatStore'
import type { ApiError } from '@/types/api'
import { buildHeartbeat } from '@tests/fixtures/heartbeat'
import { getButton } from '@tests/helpers/dom'
import HomeView from './HomeView.vue'

/** Views are tested against a store whose actions are spies: no services, no network. */
function mountView(
  arrange: (store: ReturnType<typeof useHeartbeatStore>) => void = () => undefined,
) {
  const pinia = createTestingPinia({ createSpy: vi.fn })
  const store = useHeartbeatStore(pinia)
  arrange(store)
  const wrapper = mount(HomeView, { global: { plugins: [pinia] } })
  return { wrapper, store }
}

describe('HomeView', () => {
  it('shows placeholders before the first heartbeat', () => {
    const { wrapper } = mountView()

    expect(wrapper.text()).toContain('Checking…')
    expect(wrapper.get('[data-testid="server-version"]').text()).toBe('—')
    expect(wrapper.get('[data-testid="last-checked"]').text()).toBe('—')
  })

  it('shows the connection, server version and time of the last check', () => {
    const { wrapper } = mountView((store) => {
      store.latest = buildHeartbeat({ version: '2.4.0' })
      store.lastCheckedAt = new Date('2026-01-15T10:00:00.000Z')
    })

    expect(wrapper.text()).toContain('Online')
    expect(wrapper.get('[data-testid="server-version"]').text()).toBe('2.4.0')
    expect(wrapper.get('[data-testid="last-checked"]').text()).toBe('15 Jan 2026, 10:00:00')
  })

  it('shows the last error as an alert', () => {
    const error: ApiError = { kind: 'network', message: 'Cannot reach the server.' }
    const { wrapper } = mountView((store) => {
      store.lastError = error
    })

    expect(wrapper.get('[role="alert"]').text()).toBe('Cannot reach the server.')
  })

  it('checks immediately when "Check now" is clicked', async () => {
    const { wrapper, store } = mountView()

    await getButton(wrapper, 'Check now').trigger('click')

    expect(store.checkNow).toHaveBeenCalledOnce()
  })

  it('disables "Check now" while a check is running', () => {
    const { wrapper } = mountView((store) => {
      store.isChecking = true
    })

    expect(getButton(wrapper, 'Check now').attributes('disabled')).toBeDefined()
  })
})
