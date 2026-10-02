export interface PollerOptions<T> {
  /** The API call to repeat. It should not throw; return an `ApiResult` to carry failures. */
  readonly request: () => Promise<T>
  /** Receives the response of every poll. */
  readonly callback: (value: T) => void
  /** Delay between the end of one poll and the start of the next. */
  readonly intervalMs: number
  /** Called when `request` or `callback` throws. Polling continues. */
  readonly onError?: (error: unknown) => void
  /** `true` (default): first poll runs immediately. `false`: after one interval. */
  readonly immediate?: boolean
}

/**
 * Calls `request` repeatedly and hands every response to `callback`.
 * The next poll is scheduled only after the previous one finished, so requests never overlap.
 */
export class Poller<T> {
  private readonly options: PollerOptions<T>
  private timer: ReturnType<typeof setTimeout> | undefined
  private running = false
  /** Bumped on every start/stop so a response that arrives after `stop()` is ignored. */
  private generation = 0

  constructor(options: PollerOptions<T>) {
    if (!(options.intervalMs > 0)) {
      throw new RangeError('intervalMs must be greater than 0')
    }
    this.options = options
  }

  get isRunning(): boolean {
    return this.running
  }

  start(): void {
    if (this.running) return
    this.running = true
    const generation = ++this.generation
    if (this.options.immediate ?? true) {
      void this.poll(generation)
    } else {
      this.schedule(generation)
    }
  }

  stop(): void {
    this.running = false
    this.generation++
    clearTimeout(this.timer)
    this.timer = undefined
  }

  private async poll(generation: number): Promise<void> {
    try {
      const value = await this.options.request()
      if (generation !== this.generation) return
      this.options.callback(value)
    } catch (error) {
      if (generation === this.generation) this.options.onError?.(error)
    }
    if (generation === this.generation) this.schedule(generation)
  }

  private schedule(generation: number): void {
    this.timer = setTimeout(() => {
      void this.poll(generation)
    }, this.options.intervalMs)
  }
}
