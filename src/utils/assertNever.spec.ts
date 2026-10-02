import { describe, expect, it } from 'vitest'
import { assertNever } from './assertNever'

describe('assertNever', () => {
  it('throws with the unexpected value, so an unhandled union member is loud at runtime too', () => {
    // At compile time this call only type-checks for `never`; the cast simulates bad data from the network.
    expect(() => assertNever('surprise' as never)).toThrow('Unexpected value: surprise')
  })
})
