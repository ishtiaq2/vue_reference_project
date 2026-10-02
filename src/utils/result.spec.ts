import { describe, expect, it } from 'vitest'
import { fail, ok } from './result'

describe('ok / fail', () => {
  it('ok builds the success side of an ApiResult', () => {
    expect(ok(5)).toEqual({ ok: true, data: 5 })
  })

  it('fail builds the failure side of an ApiResult', () => {
    expect(fail({ kind: 'unknown', message: 'x' })).toEqual({
      ok: false,
      error: { kind: 'unknown', message: 'x' },
    })
  })
})
