import { DeviceDtoSchema, NewDeviceDtoSchema, type DeviceDto } from '../../src/types/device'
import { HeartbeatDtoSchema, type HeartbeatDto } from '../../src/types/heartbeat'

export interface MockRequest {
  readonly method: string
  /** Path below the API prefix, e.g. `/devices/dev-001`. */
  readonly path: string
  readonly body: unknown
}

export interface MockResponse {
  readonly status: number
  readonly body?: unknown
}

export const SEED_DEVICES: readonly DeviceDto[] = [
  {
    id: 'dev-001',
    name: 'Edge Router 1',
    firmware_version: '1.4.2',
    status: 'online',
    last_seen: '2026-01-15T10:00:00.000Z',
  },
  {
    id: 'dev-002',
    name: 'Core Switch',
    firmware_version: '2.0.1',
    status: 'online',
    last_seen: '2026-01-15T09:45:00.000Z',
  },
  {
    id: 'dev-003',
    name: 'Branch Gateway',
    firmware_version: '1.3.9',
    status: 'offline',
    last_seen: '2026-01-14T18:30:00.000Z',
  },
]

const SERVER_VERSION = '1.0.0'

/**
 * In-memory fake of the backend. Framework-agnostic: the Vite plugin adapts it to HTTP.
 * Responses are validated against the same zod schemas the app and the API tests use.
 */
export function createMockBackend(now: () => Date = () => new Date()) {
  let devices: DeviceDto[] = SEED_DEVICES.map((device) => ({ ...device }))
  let nextId = SEED_DEVICES.length + 1

  function heartbeat(): MockResponse {
    const body: HeartbeatDto = HeartbeatDtoSchema.parse({
      status: 'UP',
      timestamp: now().toISOString(),
      version: SERVER_VERSION,
    })
    return { status: 200, body }
  }

  function createDevice(input: unknown): MockResponse {
    const parsed = NewDeviceDtoSchema.safeParse(input)
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? 'Invalid request body'
      return { status: 422, body: { message } }
    }
    if (devices.some((device) => device.name === parsed.data.name)) {
      return {
        status: 409,
        body: { message: `A device named "${parsed.data.name}" already exists` },
      }
    }
    const device = DeviceDtoSchema.parse({
      id: `dev-${String(nextId++).padStart(3, '0')}`,
      name: parsed.data.name,
      firmware_version: parsed.data.firmware_version,
      status: 'offline',
      last_seen: now().toISOString(),
    })
    devices = [...devices, device]
    return { status: 201, body: device }
  }

  function deleteDevice(id: string): MockResponse {
    if (!devices.some((device) => device.id === id)) {
      return { status: 404, body: { message: `Device ${id} not found` } }
    }
    devices = devices.filter((device) => device.id !== id)
    return { status: 204 }
  }

  function reset(): MockResponse {
    devices = SEED_DEVICES.map((device) => ({ ...device }))
    nextId = SEED_DEVICES.length + 1
    return { status: 204 }
  }

  function handle({ method, path, body }: MockRequest): MockResponse {
    if (path === '/heartbeat') return method === 'GET' ? heartbeat() : methodNotAllowed()
    if (path === '/devices') {
      if (method === 'GET') return { status: 200, body: devices }
      if (method === 'POST') return createDevice(body)
      return methodNotAllowed()
    }
    if (path === '/__mock__/reset') return method === 'POST' ? reset() : methodNotAllowed()

    const deviceMatch = /^\/devices\/([^/]+)$/.exec(path)
    if (deviceMatch?.[1] !== undefined) {
      return method === 'DELETE'
        ? deleteDevice(decodeURIComponent(deviceMatch[1]))
        : methodNotAllowed()
    }
    return { status: 404, body: { message: 'Not found' } }
  }

  return { handle }
}

function methodNotAllowed(): MockResponse {
  return { status: 405, body: { message: 'Method not allowed' } }
}
