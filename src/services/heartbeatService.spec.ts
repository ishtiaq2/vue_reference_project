import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { API_PATHS } from '@/constants/api'
import { buildHeartbeat, buildHeartbeatDto } from '@tests/fixtures/heartbeat'
import { apiUrl } from '@tests/mocks/handlers'
import { server } from '@tests/mocks/server'
import { heartbeatService } from './heartbeatService'

describe('heartbeatService.check', () => {
  it('returns the heartbeat as a domain model', async () => {
    server.use(
      http.get(apiUrl(API_PATHS.heartbeat), () =>
        HttpResponse.json(
          buildHeartbeatDto({ version: '3.0.0', timestamp: '2026-03-01T00:00:00.000Z' }),
        ),
      ),
    )

    await expect(heartbeatService.check()).resolves.toEqual({
      ok: true,
      data: buildHeartbeat({ version: '3.0.0', timestamp: new Date('2026-03-01T00:00:00.000Z') }),
    })
  })

  it('returns a failure with the server message when the API responds with an error', async () => {
    server.use(
      http.get(apiUrl(API_PATHS.heartbeat), () =>
        HttpResponse.json({ message: 'Service unavailable' }, { status: 503 }),
      ),
    )

    await expect(heartbeatService.check()).resolves.toEqual({
      ok: false,
      error: { kind: 'http', status: 503, message: 'Service unavailable' },
    })
  })

  it('returns a network failure when the server cannot be reached', async () => {
    server.use(http.get(apiUrl(API_PATHS.heartbeat), () => HttpResponse.error()))

    const result = await heartbeatService.check()

    expect(result).toMatchObject({ ok: false, error: { kind: 'network' } })
  })

  it('returns a validation failure when the payload does not match the contract', async () => {
    server.use(http.get(apiUrl(API_PATHS.heartbeat), () => HttpResponse.json({ status: 'MAYBE' })))

    const result = await heartbeatService.check()

    expect(result).toMatchObject({ ok: false, error: { kind: 'validation' } })
  })
})
