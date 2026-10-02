import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { env } from '@/infrastructure/config/env'
import { HEARTBEAT_FAILURE_THRESHOLD } from '@/constants/polling'
import { heartbeatService } from '@/services/heartbeatService'
import { fail, ok } from '@/utils/result'
import type { ApiError } from '@/types/api'
import { buildHeartbeat } from '@tests/fixtures/heartbeat'
import { useHeartbeatStore } from './heartbeatStore'

vi.mock('@/services/heartbeatService')

const networkError: ApiError = { kind: 'network', message: 'Cannot reach the server.' }
const NOW = new Date('2026-01-15T10:00:00.000Z')

describe('heartbeatStore', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(NOW)
    setActivePinia(createPinia())
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('starts as unknown', () => {
    const store = useHeartbeatStore()

    expect(store.connection).toBe('unknown')
    expect(store.latest).toBeNull()
    expect(store.isMonitoring).toBe(false)
  })

  it('becomes up after a successful heartbeat', async () => {
    vi.mocked(heartbeatService.check).mockResolvedValue(ok(buildHeartbeat({ version: '1.2.3' })))
    const store = useHeartbeatStore()

    store.startMonitoring()
    await vi.advanceTimersByTimeAsync(0)

    expect(store.connection).toBe('up')
    expect(store.latest?.version).toBe('1.2.3')
    expect(store.lastCheckedAt).toEqual(NOW)
    expect(store.lastError).toBeNull()
    expect(store.isMonitoring).toBe(true)
  })

  it('keeps polling at the configured interval', async () => {
    vi.mocked(heartbeatService.check).mockResolvedValue(ok(buildHeartbeat()))
    const store = useHeartbeatStore()

    store.startMonitoring()
    await vi.advanceTimersByTimeAsync(env.heartbeatIntervalMs * 2)

    expect(heartbeatService.check).toHaveBeenCalledTimes(3)
  })

  it('stays up through a single failure and goes down after the threshold', async () => {
    vi.mocked(heartbeatService.check)
      .mockResolvedValueOnce(ok(buildHeartbeat()))
      .mockResolvedValue(fail(networkError))
    const store = useHeartbeatStore()

    store.startMonitoring()
    await vi.advanceTimersByTimeAsync(0)
    await vi.advanceTimersByTimeAsync(env.heartbeatIntervalMs)
    expect(store.consecutiveFailures).toBe(1)
    expect(store.connection).toBe('up')

    await vi.advanceTimersByTimeAsync(env.heartbeatIntervalMs * (HEARTBEAT_FAILURE_THRESHOLD - 1))
    expect(store.connection).toBe('down')
    expect(store.lastError).toEqual(networkError)
  })

  it('recovers as soon as a heartbeat succeeds again', async () => {
    vi.mocked(heartbeatService.check)
      .mockResolvedValueOnce(fail(networkError))
      .mockResolvedValueOnce(fail(networkError))
      .mockResolvedValue(ok(buildHeartbeat()))
    const store = useHeartbeatStore()

    store.startMonitoring()
    await vi.advanceTimersByTimeAsync(env.heartbeatIntervalMs)
    expect(store.connection).toBe('down')

    await vi.advanceTimersByTimeAsync(env.heartbeatIntervalMs)
    expect(store.connection).toBe('up')
    expect(store.consecutiveFailures).toBe(0)
    expect(store.lastError).toBeNull()
  })

  it('reports down when the server itself says it is down', async () => {
    vi.mocked(heartbeatService.check).mockResolvedValue(ok(buildHeartbeat({ status: 'DOWN' })))
    const store = useHeartbeatStore()

    store.startMonitoring()
    await vi.advanceTimersByTimeAsync(0)

    expect(store.connection).toBe('down')
  })

  it('stops polling on stopMonitoring()', async () => {
    vi.mocked(heartbeatService.check).mockResolvedValue(ok(buildHeartbeat()))
    const store = useHeartbeatStore()
    store.startMonitoring()
    await vi.advanceTimersByTimeAsync(0)

    store.stopMonitoring()
    await vi.advanceTimersByTimeAsync(env.heartbeatIntervalMs * 5)

    expect(heartbeatService.check).toHaveBeenCalledTimes(1)
    expect(store.isMonitoring).toBe(false)
  })

  it('stops polling when the store is disposed', async () => {
    vi.mocked(heartbeatService.check).mockResolvedValue(ok(buildHeartbeat()))
    const store = useHeartbeatStore()
    store.startMonitoring()
    await vi.advanceTimersByTimeAsync(0)

    store.$dispose()
    await vi.advanceTimersByTimeAsync(env.heartbeatIntervalMs * 5)

    expect(heartbeatService.check).toHaveBeenCalledTimes(1)
  })

  describe('checkNow', () => {
    it('records a one-off check and shows it is busy meanwhile', async () => {
      vi.mocked(heartbeatService.check).mockResolvedValue(ok(buildHeartbeat()))
      const store = useHeartbeatStore()

      const checking = store.checkNow()
      expect(store.isChecking).toBe(true)
      await checking

      expect(store.isChecking).toBe(false)
      expect(store.connection).toBe('up')
    })

    it('records a failure too', async () => {
      vi.mocked(heartbeatService.check).mockResolvedValue(fail(networkError))
      const store = useHeartbeatStore()

      await store.checkNow()

      expect(store.lastError).toEqual(networkError)
      expect(store.consecutiveFailures).toBe(1)
    })
  })
})
