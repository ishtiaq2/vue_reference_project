import { defineStore } from 'pinia'
import { computed, shallowRef } from 'vue'
import { useApiAction } from '@/composables/useApiAction'
import { deviceService } from '@/services/deviceService'
import type { ApiResult } from '@/types/api'
import type { Device, NewDevice } from '@/types/device'

export const useDeviceStore = defineStore('devices', () => {
  const devices = shallowRef<readonly Device[]>([])

  const list = useApiAction(() => deviceService.list(), {
    onSuccess: (data) => {
      devices.value = data
    },
  })

  const create = useApiAction((input: NewDevice) => deviceService.create(input), {
    onSuccess: (device) => {
      devices.value = [...devices.value, device]
    },
  })

  const remove = useApiAction((id: string) => deviceService.remove(id))

  const onlineCount = computed(() => devices.value.filter((d) => d.status === 'online').length)

  async function removeDevice(id: string): Promise<ApiResult<void>> {
    const result = await remove.execute(id)
    if (result.ok) devices.value = devices.value.filter((d) => d.id !== id)
    return result
  }

  return {
    devices,
    onlineCount,
    listStatus: list.status,
    listError: list.error,
    createStatus: create.status,
    createError: create.error,
    removeStatus: remove.status,
    removeError: remove.error,
    fetchDevices: list.execute,
    addDevice: create.execute,
    removeDevice,
    resetCreate: create.reset,
    resetRemove: remove.reset,
  }
})
