import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { deviceService } from '@/services/deviceService'
import { fail, ok } from '@/utils/result'
import type { ApiError } from '@/types/api'
import { buildDevice, buildNewDevice } from '@tests/fixtures/device'
import { useDeviceStore } from './deviceStore'

vi.mock('@/services/deviceService')

const serverError: ApiError = { kind: 'http', status: 500, message: 'Server error' }
const devices = [
  buildDevice({ id: 'a', name: 'Alpha', status: 'online' }),
  buildDevice({ id: 'b', name: 'Beta', status: 'offline' }),
  buildDevice({ id: 'c', name: 'Gamma', status: 'online' }),
]

describe('deviceStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('fetchDevices', () => {
    it('loads the devices', async () => {
      vi.mocked(deviceService.list).mockResolvedValue(ok(devices))
      const store = useDeviceStore()

      await store.fetchDevices()

      expect(store.devices).toEqual(devices)
      expect(store.listStatus).toBe('success')
      expect(store.onlineCount).toBe(2)
    })

    it('exposes the error and keeps the list empty when loading fails', async () => {
      vi.mocked(deviceService.list).mockResolvedValue(fail(serverError))
      const store = useDeviceStore()

      await store.fetchDevices()

      expect(store.listStatus).toBe('failure')
      expect(store.listError).toEqual(serverError)
      expect(store.devices).toEqual([])
    })

    it('shows the loading state while the request runs', async () => {
      vi.mocked(deviceService.list).mockResolvedValue(ok(devices))
      const store = useDeviceStore()

      const loading = store.fetchDevices()
      expect(store.listStatus).toBe('loading')
      await loading
    })
  })

  describe('addDevice', () => {
    it('sends the input to the service and appends the created device', async () => {
      const created = buildDevice({ id: 'new', name: 'Lab Router' })
      vi.mocked(deviceService.create).mockResolvedValue(ok(created))
      vi.mocked(deviceService.list).mockResolvedValue(ok(devices))
      const store = useDeviceStore()
      await store.fetchDevices()

      const result = await store.addDevice(buildNewDevice({ name: 'Lab Router' }))

      expect(deviceService.create).toHaveBeenCalledWith(buildNewDevice({ name: 'Lab Router' }))
      expect(result).toEqual({ ok: true, data: created })
      expect(store.devices).toEqual([...devices, created])
      expect(store.createStatus).toBe('success')
    })

    it('leaves the list untouched and exposes the error when creating fails', async () => {
      vi.mocked(deviceService.create).mockResolvedValue(fail(serverError))
      const store = useDeviceStore()

      const result = await store.addDevice(buildNewDevice())

      expect(result.ok).toBe(false)
      expect(store.devices).toEqual([])
      expect(store.createError).toEqual(serverError)
    })

    it('resetCreate() clears a previous error', async () => {
      vi.mocked(deviceService.create).mockResolvedValue(fail(serverError))
      const store = useDeviceStore()
      await store.addDevice(buildNewDevice())

      store.resetCreate()

      expect(store.createStatus).toBe('idle')
      expect(store.createError).toBeNull()
    })
  })

  describe('removeDevice', () => {
    it('removes the device from the list when the service succeeds', async () => {
      vi.mocked(deviceService.list).mockResolvedValue(ok(devices))
      vi.mocked(deviceService.remove).mockResolvedValue(ok(undefined))
      const store = useDeviceStore()
      await store.fetchDevices()

      const result = await store.removeDevice('b')

      expect(deviceService.remove).toHaveBeenCalledWith('b')
      expect(result.ok).toBe(true)
      expect(store.devices.map((d) => d.id)).toEqual(['a', 'c'])
    })

    it('keeps the device and exposes the error when the service fails', async () => {
      vi.mocked(deviceService.list).mockResolvedValue(ok(devices))
      vi.mocked(deviceService.remove).mockResolvedValue(fail(serverError))
      const store = useDeviceStore()
      await store.fetchDevices()

      const result = await store.removeDevice('b')

      expect(result.ok).toBe(false)
      expect(store.devices).toHaveLength(3)
      expect(store.removeError).toEqual(serverError)
    })
  })
})
