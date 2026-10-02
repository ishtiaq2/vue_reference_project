import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { API_PATHS } from '@/constants/api'
import { buildDevice, buildDeviceDto, buildNewDevice } from '@tests/fixtures/device'
import { apiUrl, DEFAULT_DEVICES } from '@tests/mocks/handlers'
import { server } from '@tests/mocks/server'
import { deviceService } from './deviceService'

describe('deviceService.list', () => {
  it('returns devices as domain models', async () => {
    server.use(http.get(apiUrl(API_PATHS.devices), () => HttpResponse.json([buildDeviceDto()])))

    await expect(deviceService.list()).resolves.toEqual({ ok: true, data: [buildDevice()] })
  })

  it('returns every device the API sends', async () => {
    const result = await deviceService.list()

    expect(result.ok && result.data.map((device) => device.id)).toEqual(
      DEFAULT_DEVICES.map((d) => d.id),
    )
  })

  it('returns a failure when the API errors', async () => {
    server.use(
      http.get(apiUrl(API_PATHS.devices), () =>
        HttpResponse.json({ message: 'Database is down' }, { status: 500 }),
      ),
    )

    await expect(deviceService.list()).resolves.toEqual({
      ok: false,
      error: { kind: 'http', status: 500, message: 'Database is down' },
    })
  })

  it('returns a validation failure when an item breaks the contract', async () => {
    server.use(http.get(apiUrl(API_PATHS.devices), () => HttpResponse.json([{ id: 1 }])))

    const result = await deviceService.list()

    expect(result).toMatchObject({ ok: false, error: { kind: 'validation' } })
  })
})

describe('deviceService.create', () => {
  it('posts the snake_case wire format and returns the created device', async () => {
    let received: unknown
    server.use(
      http.post(apiUrl(API_PATHS.devices), async ({ request }) => {
        received = await request.json()
        return HttpResponse.json(
          buildDeviceDto({ id: 'dev-9', name: 'Lab Router', firmware_version: '1.0.0' }),
          {
            status: 201,
          },
        )
      }),
    )

    const result = await deviceService.create(
      buildNewDevice({ name: 'Lab Router', firmwareVersion: '1.0.0' }),
    )

    expect(received).toEqual({ name: 'Lab Router', firmware_version: '1.0.0' })
    expect(result).toEqual({
      ok: true,
      data: buildDevice({ id: 'dev-9', name: 'Lab Router', firmwareVersion: '1.0.0' }),
    })
  })

  it('returns the server validation message on a 422', async () => {
    server.use(
      http.post(apiUrl(API_PATHS.devices), () =>
        HttpResponse.json({ message: 'Name must be at least 3 characters' }, { status: 422 }),
      ),
    )

    await expect(deviceService.create(buildNewDevice())).resolves.toEqual({
      ok: false,
      error: { kind: 'http', status: 422, message: 'Name must be at least 3 characters' },
    })
  })
})

describe('deviceService.remove', () => {
  it('resolves with a success result on 204', async () => {
    await expect(deviceService.remove('dev-001')).resolves.toEqual({ ok: true, data: undefined })
  })

  it('url-encodes the id', async () => {
    let requestedPath = ''
    server.use(
      http.delete(apiUrl(`${API_PATHS.devices}/:id`), ({ request }) => {
        requestedPath = new URL(request.url).pathname
        return new HttpResponse(null, { status: 204 })
      }),
    )

    await deviceService.remove('a/b')

    expect(requestedPath).toBe('/api/devices/a%2Fb')
  })

  it('returns a failure when the device does not exist', async () => {
    server.use(
      http.delete(apiUrl(`${API_PATHS.devices}/:id`), () =>
        HttpResponse.json({ message: 'Device dev-9 not found' }, { status: 404 }),
      ),
    )

    await expect(deviceService.remove('dev-9')).resolves.toEqual({
      ok: false,
      error: { kind: 'http', status: 404, message: 'Device dev-9 not found' },
    })
  })
})
