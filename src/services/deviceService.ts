import type { AxiosInstance } from 'axios'
import { API_PATHS } from '@/constants/api'
import { toDevice, toNewDeviceDto } from '@/models/device'
import type { ApiResult } from '@/types/api'
import { DeviceDtoListSchema, DeviceDtoSchema, type Device, type NewDevice } from '@/types/device'
import { safeRequest } from '@/infrastructure/http/apiResult'
import { httpClient } from '@/infrastructure/http/httpClient'
import { getJson, postJson } from '@/infrastructure/http/typedRequest'

export function createDeviceService(http: AxiosInstance = httpClient) {
  return {
    list: (): Promise<ApiResult<Device[]>> =>
      safeRequest(async () =>
        (await getJson(http, API_PATHS.devices, DeviceDtoListSchema)).map(toDevice),
      ),

    create: (input: NewDevice): Promise<ApiResult<Device>> =>
      safeRequest(async () =>
        toDevice(await postJson(http, API_PATHS.devices, toNewDeviceDto(input), DeviceDtoSchema)),
      ),

    remove: (id: string): Promise<ApiResult<void>> =>
      safeRequest(async () => {
        await http.delete(API_PATHS.device(id))
      }),
  }
}

export type DeviceService = ReturnType<typeof createDeviceService>

export const deviceService: DeviceService = createDeviceService()
