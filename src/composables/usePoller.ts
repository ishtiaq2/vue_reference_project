import { getCurrentScope, onScopeDispose, ref, type Ref } from 'vue'
import { Poller, type PollerOptions } from '@/utils/poller'

export interface UsePoller {
  start: () => void
  stop: () => void
  readonly isRunning: Readonly<Ref<boolean>>
}

/** Vue wrapper around `Poller`: reactive `isRunning`, and polling stops with the component/store. */
export function usePoller<T>(options: PollerOptions<T>): UsePoller {
  const poller = new Poller(options)
  const isRunning = ref(false)

  function start(): void {
    poller.start()
    isRunning.value = poller.isRunning
  }

  function stop(): void {
    poller.stop()
    isRunning.value = false
  }

  if (getCurrentScope()) onScopeDispose(stop)

  return { start, stop, isRunning }
}
