import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { withSetup } from '@tests/helpers/withSetup'
import { usePoller } from './usePoller'

describe('usePoller', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  function options() {
    const request = vi.fn(() => Promise.resolve('pong'))
    const callback = vi.fn<(value: string) => void>()
    return { request, callback, intervalMs: 1_000 }
  }

  it('exposes a reactive isRunning flag', () => {
    const { result } = withSetup(() => usePoller(options()))

    expect(result.isRunning.value).toBe(false)
    result.start()
    expect(result.isRunning.value).toBe(true)
    result.stop()
    expect(result.isRunning.value).toBe(false)
  })

  it('polls the request and hands every response to the callback', async () => {
    const opts = options()
    const { result } = withSetup(() => usePoller(opts))

    result.start()
    await vi.advanceTimersByTimeAsync(1_000)

    expect(opts.callback).toHaveBeenCalledTimes(2)
    expect(opts.callback).toHaveBeenCalledWith('pong')
  })

  it('stops polling when the owning component is unmounted', async () => {
    const opts = options()
    const { result, unmount } = withSetup(() => usePoller(opts))
    result.start()
    await vi.advanceTimersByTimeAsync(0)

    unmount()
    await vi.advanceTimersByTimeAsync(10_000)

    expect(opts.request).toHaveBeenCalledTimes(1)
    expect(result.isRunning.value).toBe(false)
  })

  it('also works outside a component, without Vue warning about a missing scope', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const opts = options()
    const poller = usePoller(opts)

    poller.start()
    await vi.advanceTimersByTimeAsync(0)
    poller.stop()

    expect(opts.callback).toHaveBeenCalledTimes(1)
    expect(warn).not.toHaveBeenCalled()
  })
})
