import { http, HttpResponse } from 'msw'
import { describe, expect, it, vi } from 'vitest'
import type * as EnvModule from '@/infrastructure/config/env'
import { API_PATHS } from '@/constants/api'
import { buildHeartbeatDto } from '@tests/fixtures/heartbeat'
import { apiUrl } from '@tests/mocks/handlers'
import { server } from '@tests/mocks/server'
import { mountApp } from '@tests/helpers/mountApp'

// Poll every 20 ms instead of every 10 s so the flow can be tested in real time.
vi.mock('@/infrastructure/config/env', async (importOriginal) => {
  const actual = await importOriginal<typeof EnvModule>()
  return { env: { ...actual.env, heartbeatIntervalMs: 20 } }
})

const down = http.get(apiUrl(API_PATHS.heartbeat), () =>
  HttpResponse.json({ message: 'Service unavailable' }, { status: 503 }),
)

describe('Heartbeat monitoring in the app', () => {
  it('shows the server as online after the first heartbeat', async () => {
    const { wrapper } = await mountApp()
    const indicator = wrapper.get('[data-testid="heartbeat-indicator"]')
    expect(indicator.text()).toBe('Checking…')

    await vi.waitFor(() => expect(indicator.text()).toBe('Online'))
  })

  it('shows the server as offline when the API keeps failing, and recovers', async () => {
    server.use(down)
    const { wrapper } = await mountApp()
    const indicator = wrapper.get('[data-testid="heartbeat-indicator"]')

    await vi.waitFor(() => expect(indicator.text()).toBe('Offline'))

    server.use(http.get(apiUrl(API_PATHS.heartbeat), () => HttpResponse.json(buildHeartbeatDto())))
    await vi.waitFor(() => expect(indicator.text()).toBe('Online'))
  })

  it('stops polling once the app is gone', async () => {
    let calls = 0
    server.use(
      http.get(apiUrl(API_PATHS.heartbeat), () => {
        calls++
        return HttpResponse.json(buildHeartbeatDto())
      }),
    )
    const { wrapper } = await mountApp()
    await vi.waitFor(() => expect(calls).toBeGreaterThan(1))

    wrapper.unmount()
    const callsAtUnmount = calls
    await new Promise((resolve) => setTimeout(resolve, 100))

    expect(calls).toBe(callsAtUnmount)
  })
})
