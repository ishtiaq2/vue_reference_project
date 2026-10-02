import { expect, test } from '@playwright/test'
import { HeartbeatDtoSchema } from '../../src/types/heartbeat'

// API tests: plain HTTP against the running backend, no browser.
// The same file works against any environment: set BASE_URL to point it elsewhere.
test.describe('GET /api/heartbeat', () => {
  test('returns 200 with JSON that matches the heartbeat contract', async ({ request }) => {
    const response = await request.get('/api/heartbeat')

    expect(response.status()).toBe(200)
    expect(response.headers()['content-type']).toContain('application/json')
    expect(HeartbeatDtoSchema.safeParse(await response.json())).toMatchObject({ success: true })
  })

  test('reports the server as UP with a fresh timestamp', async ({ request }) => {
    const before = Date.now()

    const body = HeartbeatDtoSchema.parse(await (await request.get('/api/heartbeat')).json())

    expect(body.status).toBe('UP')
    expect(Date.parse(body.timestamp)).toBeGreaterThanOrEqual(before - 1_000)
  })

  test('rejects methods other than GET', async ({ request }) => {
    const response = await request.post('/api/heartbeat')

    expect(response.status()).toBe(405)
  })
})
