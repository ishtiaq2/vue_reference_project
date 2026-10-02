import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createDeferred } from '@tests/helpers/deferred'
import { Poller } from './poller'

const INTERVAL = 1_000

function setup(options: { immediate?: boolean; onError?: (error: unknown) => void } = {}) {
  let counter = 0
  const request = vi.fn<() => Promise<number>>(() => Promise.resolve(++counter))
  const callback = vi.fn<(value: number) => void>()
  const poller = new Poller({ request, callback, intervalMs: INTERVAL, ...options })
  return { poller, request, callback }
}

describe('Poller', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('polls immediately and passes the response to the callback', async () => {
    const { poller, callback } = setup()

    poller.start()
    await vi.advanceTimersByTimeAsync(0)

    expect(callback).toHaveBeenCalledExactlyOnceWith(1)
  })

  it('polls again after every interval', async () => {
    const { poller, callback } = setup()

    poller.start()
    await vi.advanceTimersByTimeAsync(INTERVAL * 2)

    expect(callback.mock.calls).toEqual([[1], [2], [3]])
  })

  it('waits one interval before the first poll when immediate is false', async () => {
    const { poller, request } = setup({ immediate: false })

    poller.start()
    await vi.advanceTimersByTimeAsync(INTERVAL - 1)
    expect(request).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(1)
    expect(request).toHaveBeenCalledTimes(1)
  })

  it('never overlaps requests: the next poll waits for the previous one to finish', async () => {
    const slow = createDeferred<number>()
    const request = vi.fn<() => Promise<number>>(() => slow.promise)
    const callback = vi.fn<(value: number) => void>()
    const poller = new Poller({ request, callback, intervalMs: INTERVAL })

    poller.start()
    await vi.advanceTimersByTimeAsync(INTERVAL * 5)
    expect(request).toHaveBeenCalledTimes(1)

    slow.resolve(42)
    await vi.advanceTimersByTimeAsync(0)
    expect(callback).toHaveBeenCalledExactlyOnceWith(42)

    await vi.advanceTimersByTimeAsync(INTERVAL)
    expect(request).toHaveBeenCalledTimes(2)
  })

  it('ignores a second start() while running', async () => {
    const { poller, request } = setup()

    poller.start()
    poller.start()
    await vi.advanceTimersByTimeAsync(0)

    expect(request).toHaveBeenCalledTimes(1)
  })

  it('stops polling after stop()', async () => {
    const { poller, request } = setup()
    poller.start()
    await vi.advanceTimersByTimeAsync(0)

    poller.stop()
    await vi.advanceTimersByTimeAsync(INTERVAL * 5)

    expect(request).toHaveBeenCalledTimes(1)
  })

  it('drops the response of a request that was still in flight when stop() was called', async () => {
    const slow = createDeferred<number>()
    const callback = vi.fn<(value: number) => void>()
    const poller = new Poller({ request: () => slow.promise, callback, intervalMs: INTERVAL })

    poller.start()
    poller.stop()
    slow.resolve(1)
    await vi.advanceTimersByTimeAsync(INTERVAL * 2)

    expect(callback).not.toHaveBeenCalled()
  })

  it('ignores the failure of a request that was still in flight when stop() was called', async () => {
    const slow = createDeferred<number>()
    const request = vi.fn(() => slow.promise)
    const onError = vi.fn<(error: unknown) => void>()
    const poller = new Poller({ request, callback: vi.fn(), intervalMs: INTERVAL, onError })

    poller.start()
    poller.stop()
    slow.reject(new Error('too late'))
    await vi.advanceTimersByTimeAsync(INTERVAL * 2)

    expect(onError).not.toHaveBeenCalled()
    // ...and the late failure must not bring a stopped poller back to life.
    expect(request).toHaveBeenCalledTimes(1)
  })

  it('ignores a response from an earlier run after a stop and restart', async () => {
    const earlier = createDeferred<number>()
    const current = createDeferred<number>()
    const request = vi
      .fn<() => Promise<number>>()
      .mockReturnValueOnce(earlier.promise)
      .mockReturnValueOnce(current.promise)
      .mockResolvedValue(0)
    const callback = vi.fn<(value: number) => void>()
    const poller = new Poller({ request, callback, intervalMs: INTERVAL })

    poller.start()
    poller.stop()
    poller.start()
    earlier.resolve(1)
    await vi.advanceTimersByTimeAsync(0)
    expect(callback).not.toHaveBeenCalled()

    current.resolve(2)
    await vi.advanceTimersByTimeAsync(0)
    expect(callback).toHaveBeenCalledExactlyOnceWith(2)
  })

  it('can be restarted after stop()', async () => {
    const { poller, callback } = setup()

    poller.start()
    await vi.advanceTimersByTimeAsync(0)
    poller.stop()
    poller.start()
    await vi.advanceTimersByTimeAsync(0)

    expect(callback.mock.calls).toEqual([[1], [2]])
  })

  it('reports whether it is running', () => {
    const { poller } = setup()

    expect(poller.isRunning).toBe(false)
    poller.start()
    expect(poller.isRunning).toBe(true)
    poller.stop()
    expect(poller.isRunning).toBe(false)
  })

  it('reports a failing request to onError and keeps polling', async () => {
    const onError = vi.fn<(error: unknown) => void>()
    const failure = new Error('boom')
    const request = vi
      .fn<() => Promise<number>>()
      .mockRejectedValueOnce(failure)
      .mockResolvedValue(7)
    const callback = vi.fn<(value: number) => void>()
    const poller = new Poller({ request, callback, intervalMs: INTERVAL, onError })

    poller.start()
    await vi.advanceTimersByTimeAsync(INTERVAL)

    expect(onError).toHaveBeenCalledExactlyOnceWith(failure)
    expect(callback).toHaveBeenCalledExactlyOnceWith(7)
  })

  it('reports a throwing callback to onError', async () => {
    const onError = vi.fn<(error: unknown) => void>()
    const failure = new Error('callback failed')
    const poller = new Poller({
      request: () => Promise.resolve(1),
      callback: () => {
        throw failure
      },
      intervalMs: INTERVAL,
      onError,
    })

    poller.start()
    await vi.advanceTimersByTimeAsync(0)

    expect(onError).toHaveBeenCalledExactlyOnceWith(failure)
  })

  it('keeps polling when a request fails and no onError is given', async () => {
    const request = vi.fn<() => Promise<number>>().mockRejectedValue(new Error('boom'))
    const poller = new Poller({ request, callback: vi.fn(), intervalMs: INTERVAL })

    poller.start()
    await vi.advanceTimersByTimeAsync(INTERVAL)

    expect(request).toHaveBeenCalledTimes(2)
  })

  it.each([0, -5, Number.NaN])('rejects an invalid interval (%s)', (intervalMs) => {
    const create = () => new Poller({ request: vi.fn(), callback: vi.fn(), intervalMs })

    expect(create).toThrow(RangeError)
    expect(create).toThrow('intervalMs must be greater than 0')
  })
})
