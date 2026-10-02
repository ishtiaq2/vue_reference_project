import { defineStore } from 'pinia'
import { computed, ref, shallowRef } from 'vue'
import { usePoller } from '@/composables/usePoller'
import { env } from '@/infrastructure/config/env'
import { HEARTBEAT_FAILURE_THRESHOLD } from '@/constants/polling'
import { heartbeatService } from '@/services/heartbeatService'
import type { ApiError, ApiResult } from '@/types/api'
import type { ConnectionState, Heartbeat } from '@/types/heartbeat'

export const useHeartbeatStore = defineStore('heartbeat', () => {
  const latest = shallowRef<Heartbeat | null>(null)
  const lastError = shallowRef<ApiError | null>(null)
  const lastCheckedAt = shallowRef<Date | null>(null)
  const consecutiveFailures = ref(0)
  const isChecking = ref(false)

  const connection = computed<ConnectionState>(() => {
    if (consecutiveFailures.value >= HEARTBEAT_FAILURE_THRESHOLD) return 'down'
    if (latest.value === null) return 'unknown'
    return latest.value.status === 'UP' ? 'up' : 'down'
  })

  /** The poller's callback: receives every heartbeat result, success or failure. */
  function record(result: ApiResult<Heartbeat>): void {
    lastCheckedAt.value = new Date()
    if (result.ok) {
      latest.value = result.data
      lastError.value = null
      consecutiveFailures.value = 0
    } else {
      lastError.value = result.error
      consecutiveFailures.value += 1
    }
  }

  const poller = usePoller({
    request: () => heartbeatService.check(),
    callback: record,
    intervalMs: env.heartbeatIntervalMs,
  })

  /** One-off check, e.g. from a "Check now" button. */
  async function checkNow(): Promise<void> {
    isChecking.value = true
    try {
      record(await heartbeatService.check())
    } finally {
      isChecking.value = false
    }
  }

  return {
    latest,
    lastError,
    lastCheckedAt,
    consecutiveFailures,
    isChecking,
    connection,
    isMonitoring: poller.isRunning,
    startMonitoring: poller.start,
    stopMonitoring: poller.stop,
    checkNow,
  }
})
