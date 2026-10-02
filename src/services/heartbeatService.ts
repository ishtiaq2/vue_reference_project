import type { AxiosInstance } from 'axios'
import { API_PATHS } from '@/constants/api'
import { toHeartbeat } from '@/models/heartbeat'
import { HeartbeatDtoSchema, type Heartbeat } from '@/types/heartbeat'
import type { ApiResult } from '@/types/api'
import { safeRequest } from '@/infrastructure/http/apiResult'
import { httpClient } from '@/infrastructure/http/httpClient'
import { getJson } from '@/infrastructure/http/typedRequest'

export function createHeartbeatService(http: AxiosInstance = httpClient) {
  return {
    /** Heartbeat API: resolves with the server status, or a failure when it can't be reached. */
    check: (): Promise<ApiResult<Heartbeat>> =>
      safeRequest(async () =>
        toHeartbeat(await getJson(http, API_PATHS.heartbeat, HeartbeatDtoSchema)),
      ),
  }
}

export type HeartbeatService = ReturnType<typeof createHeartbeatService>

export const heartbeatService: HeartbeatService = createHeartbeatService()
