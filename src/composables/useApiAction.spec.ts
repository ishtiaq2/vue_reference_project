import { describe, expect, it, vi } from 'vitest'
import { fail, ok } from '@/utils/result'
import type { ApiError, ApiResult } from '@/types/api'
import { createDeferred } from '@tests/helpers/deferred'
import { useApiAction } from './useApiAction'

const error: ApiError = { kind: 'http', status: 500, message: 'Server error' }

describe('useApiAction', () => {
  it('starts idle', () => {
    const action = useApiAction(() => Promise.resolve(ok(1)))

    expect(action.status.value).toBe('idle')
    expect(action.data.value).toBeNull()
    expect(action.error.value).toBeNull()
    expect(action.isLoading.value).toBe(false)
  })

  it('goes loading -> success and exposes the data', async () => {
    const pending = createDeferred<ApiResult<string>>()
    const onSuccess = vi.fn<(data: string) => void>()
    const action = useApiAction(() => pending.promise, { onSuccess })

    const running = action.execute()
    expect(action.status.value).toBe('loading')
    expect(action.isLoading.value).toBe(true)

    pending.resolve(ok('hello'))
    await running

    expect(action.status.value).toBe('success')
    expect(action.data.value).toBe('hello')
    expect(onSuccess).toHaveBeenCalledExactlyOnceWith('hello')
  })

  it('goes loading -> failure and exposes the error', async () => {
    const onFailure = vi.fn<(error: ApiError) => void>()
    const action = useApiAction(() => Promise.resolve(fail(error)), { onFailure })

    await action.execute()

    expect(action.status.value).toBe('failure')
    expect(action.error.value).toEqual(error)
    expect(action.data.value).toBeNull()
    expect(onFailure).toHaveBeenCalledExactlyOnceWith(error)
  })

  it('forwards its arguments and returns the request result', async () => {
    const request = vi.fn((a: number, b: number) => Promise.resolve(ok(a + b)))
    const action = useApiAction(request)

    const result = await action.execute(2, 3)

    expect(request).toHaveBeenCalledWith(2, 3)
    expect(result).toEqual({ ok: true, data: 5 })
  })

  it('clears the previous error when it runs again', async () => {
    const request = vi
      .fn<() => Promise<ApiResult<number>>>()
      .mockResolvedValueOnce(fail(error))
      .mockResolvedValueOnce(ok(1))
    const action = useApiAction(request)

    await action.execute()
    await action.execute()

    expect(action.error.value).toBeNull()
    expect(action.status.value).toBe('success')
  })

  it('lets only the latest call update the state', async () => {
    const first = createDeferred<ApiResult<string>>()
    const second = createDeferred<ApiResult<string>>()
    const request = vi
      .fn<() => Promise<ApiResult<string>>>()
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise)
    const action = useApiAction(request)

    const slow = action.execute()
    const fast = action.execute()
    second.resolve(ok('second'))
    await fast
    first.resolve(ok('first'))
    await slow

    expect(action.data.value).toBe('second')
  })

  it('ignores an earlier response even when reset() and a new call happened after it', async () => {
    const early = createDeferred<ApiResult<string>>()
    const later = createDeferred<ApiResult<string>>()
    const request = vi
      .fn<() => Promise<ApiResult<string>>>()
      .mockReturnValueOnce(early.promise)
      .mockReturnValueOnce(later.promise)
    const action = useApiAction(request)

    const first = action.execute()
    action.reset()
    const second = action.execute()
    early.resolve(ok('early'))
    await first

    expect(action.status.value).toBe('loading')
    expect(action.data.value).toBeNull()

    later.resolve(ok('later'))
    await second
    expect(action.data.value).toBe('later')
  })

  it('reset() returns to idle and ignores a response that is still in flight', async () => {
    const pending = createDeferred<ApiResult<string>>()
    const action = useApiAction(() => pending.promise)

    const running = action.execute()
    action.reset()
    pending.resolve(ok('late'))
    await running

    expect(action.status.value).toBe('idle')
    expect(action.data.value).toBeNull()
  })
})
