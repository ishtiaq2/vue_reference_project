import { computed, ref, shallowRef, type ComputedRef, type Ref } from 'vue'
import type { ApiError, ApiResult, RequestStatus } from '@/types/api'

export interface UseApiActionOptions<TData> {
  onSuccess?: (data: TData) => void
  onFailure?: (error: ApiError) => void
}

export interface UseApiAction<TArgs extends unknown[], TData> {
  readonly status: Readonly<Ref<RequestStatus>>
  readonly data: Readonly<Ref<TData | null>>
  readonly error: Readonly<Ref<ApiError | null>>
  readonly isLoading: ComputedRef<boolean>
  /** Runs the request. Never throws; resolves with the same `ApiResult` the request returned. */
  execute: (...args: TArgs) => Promise<ApiResult<TData>>
  reset: () => void
}

/**
 * Wraps a request that returns an `ApiResult` and tracks its state
 * (idle -> loading -> success | failure) so stores and components don't repeat it.
 */
export function useApiAction<TArgs extends unknown[], TData>(
  request: (...args: TArgs) => Promise<ApiResult<TData>>,
  options: UseApiActionOptions<TData> = {},
): UseApiAction<TArgs, TData> {
  const status = ref<RequestStatus>('idle')
  const data = shallowRef<TData | null>(null)
  const error = shallowRef<ApiError | null>(null)
  /** Only the most recent call may update the state; older, slower calls are ignored. */
  let latestCall = 0

  async function execute(...args: TArgs): Promise<ApiResult<TData>> {
    const call = ++latestCall
    status.value = 'loading'
    error.value = null

    const result = await request(...args)
    if (call !== latestCall) return result

    if (result.ok) {
      data.value = result.data
      status.value = 'success'
      options.onSuccess?.(result.data)
    } else {
      error.value = result.error
      status.value = 'failure'
      options.onFailure?.(result.error)
    }
    return result
  }

  function reset(): void {
    latestCall++
    status.value = 'idle'
    data.value = null
    error.value = null
  }

  return {
    status,
    data,
    error,
    isLoading: computed(() => status.value === 'loading'),
    execute,
    reset,
  }
}
