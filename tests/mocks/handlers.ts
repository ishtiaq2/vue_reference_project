import { http, HttpResponse } from 'msw'
import { env } from '@/infrastructure/config/env'
import { API_PATHS } from '@/constants/api'
import { NewDeviceDtoSchema, type DeviceDto } from '@/types/device'
import { buildDeviceDto } from '@tests/fixtures/device'
import { buildHeartbeatDto } from '@tests/fixtures/heartbeat'

/** Absolute-or-relative URL the app really calls, built from the same constants. */
export function apiUrl(path: string): string {
  return `${env.apiBaseUrl}${path}`
}

export const DEFAULT_DEVICES: readonly DeviceDto[] = [
  buildDeviceDto({ id: 'dev-001', name: 'Edge Router 1' }),
  buildDeviceDto({ id: 'dev-002', name: 'Core Switch', firmware_version: '2.0.1' }),
  buildDeviceDto({ id: 'dev-003', name: 'Branch Gateway', status: 'offline' }),
]

/** Stateless happy-path handlers, installed for every test. Override per test with `server.use()`. */
export const defaultHandlers = [
  http.get(apiUrl(API_PATHS.heartbeat), () => HttpResponse.json(buildHeartbeatDto())),
  http.get(apiUrl(API_PATHS.devices), () => HttpResponse.json(DEFAULT_DEVICES)),
  http.post(apiUrl(API_PATHS.devices), async ({ request }) => {
    const body = NewDeviceDtoSchema.parse(await request.json())
    return HttpResponse.json(
      buildDeviceDto({ id: 'dev-new', name: body.name, firmware_version: body.firmware_version }),
      { status: 201 },
    )
  }),
  http.delete(apiUrl(`${API_PATHS.devices}/:id`), () => new HttpResponse(null, { status: 204 })),
]

/** Stateful handlers for flows that create/delete and then re-read the list. Call once per test. */
export function createStatefulDeviceHandlers(initial: readonly DeviceDto[] = DEFAULT_DEVICES) {
  let devices = [...initial]
  return [
    http.get(apiUrl(API_PATHS.devices), () => HttpResponse.json(devices)),
    http.post(apiUrl(API_PATHS.devices), async ({ request }) => {
      const body = NewDeviceDtoSchema.parse(await request.json())
      const created = buildDeviceDto({
        id: `dev-${devices.length + 1}`,
        name: body.name,
        firmware_version: body.firmware_version,
        status: 'offline',
      })
      devices = [...devices, created]
      return HttpResponse.json(created, { status: 201 })
    }),
    http.delete(apiUrl(`${API_PATHS.devices}/:id`), ({ params }) => {
      devices = devices.filter((device) => device.id !== params['id'])
      return new HttpResponse(null, { status: 204 })
    }),
  ]
}
