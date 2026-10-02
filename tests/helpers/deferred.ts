export interface Deferred<T> {
  readonly promise: Promise<T>
  resolve: (value: T) => void
  reject: (reason: unknown) => void
}

/** A promise you resolve by hand, to test what happens while a request is still in flight. */
export function createDeferred<T>(): Deferred<T> {
  let resolve: (value: T) => void = () => undefined
  let reject: (reason: unknown) => void = () => undefined
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve: (value) => resolve(value), reject: (reason) => reject(reason) }
}
