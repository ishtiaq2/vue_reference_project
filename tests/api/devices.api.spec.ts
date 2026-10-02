import { expect, test } from '@playwright/test'
import { ApiErrorBodySchema } from '../../src/types/api'
import { DeviceDtoListSchema, DeviceDtoSchema } from '../../src/types/device'
import { resetBackend } from '../helpers/backend'

test.describe('/api/devices', () => {
  test.beforeEach(async ({ request }) => {
    await resetBackend(request)
  })

  test('GET returns the device list in the contract format', async ({ request }) => {
    const response = await request.get('/api/devices')

    expect(response.status()).toBe(200)
    const devices = DeviceDtoListSchema.parse(await response.json())
    expect(devices.map((d) => d.name)).toEqual(['Edge Router 1', 'Core Switch', 'Branch Gateway'])
  })

  test('POST creates a device, returns 201 and the device then appears in the list', async ({
    request,
  }) => {
    const created = await request.post('/api/devices', {
      data: { name: 'API Test Device', firmware_version: '3.1.4' },
    })

    expect(created.status()).toBe(201)
    const device = DeviceDtoSchema.parse(await created.json())
    expect(device).toMatchObject({
      name: 'API Test Device',
      firmware_version: '3.1.4',
      status: 'offline',
    })

    const list = DeviceDtoListSchema.parse(await (await request.get('/api/devices')).json())
    expect(list.map((d) => d.id)).toContain(device.id)
  })

  test('POST rejects an invalid body with 422 and an error message', async ({ request }) => {
    const response = await request.post('/api/devices', {
      data: { name: 'x', firmware_version: 'nope' },
    })

    expect(response.status()).toBe(422)
    expect(ApiErrorBodySchema.safeParse(await response.json())).toMatchObject({ success: true })
  })

  test('POST rejects a body that is not JSON with 400', async ({ request }) => {
    const response = await request.post('/api/devices', {
      headers: { 'Content-Type': 'application/json' },
      data: Buffer.from('{not json'), // a Buffer is sent as-is; a string would be JSON-encoded
    })

    expect(response.status()).toBe(400)
  })

  test('POST rejects a duplicate name with 409', async ({ request }) => {
    const response = await request.post('/api/devices', {
      data: { name: 'Edge Router 1', firmware_version: '1.0.0' },
    })

    expect(response.status()).toBe(409)
    expect((await response.json()) as unknown).toEqual({
      message: 'A device named "Edge Router 1" already exists',
    })
  })

  test('DELETE removes a device (204) and a second delete is a 404', async ({ request }) => {
    const first = await request.delete('/api/devices/dev-002')
    const second = await request.delete('/api/devices/dev-002')

    expect(first.status()).toBe(204)
    expect(second.status()).toBe(404)
    expect(ApiErrorBodySchema.safeParse(await second.json())).toMatchObject({ success: true })
  })

  test('an unknown route returns a 404 with an error body', async ({ request }) => {
    const response = await request.get('/api/does-not-exist')

    expect(response.status()).toBe(404)
    expect(ApiErrorBodySchema.safeParse(await response.json())).toMatchObject({ success: true })
  })
})
