import { describe, expect, it } from 'vitest'
import { createMockBackend, type MockResponse } from '../../tools/mock-api/backend'
import { API_PATHS } from '@/constants/api'
import { httpClient } from '@/infrastructure/http/httpClient'
import { ApiErrorBodySchema } from '@/types/api'
import { DeviceDtoListSchema, DeviceDtoSchema } from '@/types/device'
import { HeartbeatDtoSchema } from '@/types/heartbeat'

/**
 * Both fakes of the backend must obey the same contract (the zod schemas in src/types).
 * If a fake drifts, tests keep passing against something the real API would never send:
 * these tests catch that. The real API is checked against the same schemas by e2e/api.
 */
describe('MSW handlers (unit + integration tests)', () => {
  it('GET /heartbeat matches the heartbeat contract', async () => {
    const { data } = await httpClient.get<unknown>(API_PATHS.heartbeat)

    expect(HeartbeatDtoSchema.safeParse(data)).toMatchObject({ success: true })
  })

  it('GET /devices matches the device list contract', async () => {
    const { data } = await httpClient.get<unknown>(API_PATHS.devices)

    expect(DeviceDtoListSchema.safeParse(data)).toMatchObject({ success: true })
  })

  it('POST /devices matches the device contract', async () => {
    const { data, status } = await httpClient.post<unknown>(API_PATHS.devices, {
      name: 'Lab Router',
      firmware_version: '1.0.0',
    })

    expect(status).toBe(201)
    expect(DeviceDtoSchema.safeParse(data)).toMatchObject({ success: true })
  })
})

describe('mock-api backend (dev server, e2e + API tests)', () => {
  const backend = createMockBackend(() => new Date('2026-01-15T10:00:00.000Z'))
  const call = (method: string, path: string, body?: unknown): MockResponse =>
    backend.handle({ method, path, body })

  it('GET /heartbeat matches the heartbeat contract', () => {
    expect(HeartbeatDtoSchema.safeParse(call('GET', '/heartbeat').body)).toMatchObject({
      success: true,
    })
  })

  it('GET /devices matches the device list contract', () => {
    expect(DeviceDtoListSchema.safeParse(call('GET', '/devices').body)).toMatchObject({
      success: true,
    })
  })

  it('POST /devices returns 201 and a valid device', () => {
    const response = call('POST', '/devices', {
      name: 'Contract Device',
      firmware_version: '9.9.9',
    })

    expect(response.status).toBe(201)
    expect(DeviceDtoSchema.safeParse(response.body)).toMatchObject({ success: true })
  })

  it.each([
    ['invalid body', () => call('POST', '/devices', { name: 'x' }), 422],
    [
      'duplicate name',
      () => call('POST', '/devices', { name: 'Edge Router 1', firmware_version: '1.0.0' }),
      409,
    ],
    ['unknown device', () => call('DELETE', '/devices/nope'), 404],
    ['unknown route', () => call('GET', '/nothing'), 404],
    ['wrong method', () => call('PUT', '/devices'), 405],
  ])('%s -> error body matches the error contract', (_label, request, status) => {
    const response = request()

    expect(response.status).toBe(status)
    expect(ApiErrorBodySchema.safeParse(response.body)).toMatchObject({ success: true })
  })

  it('DELETE /devices/:id returns 204 without a body', () => {
    expect(call('DELETE', '/devices/dev-003')).toEqual({ status: 204 })
  })
})
