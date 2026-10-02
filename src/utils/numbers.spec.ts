import { describe, expect, it } from 'vitest'
import { parsePositiveInt } from './numbers'

describe('parsePositiveInt', () => {
  it.each([
    ['500', 500],
    ['1', 1],
    [' 42 ', 42],
  ])('parses %j', (raw, expected) => {
    expect(parsePositiveInt(raw, 10)).toBe(expected)
  })

  it.each([undefined, '', 'abc', '0', '-3', 'NaN'])('falls back for %j', (raw) => {
    expect(parsePositiveInt(raw, 10)).toBe(10)
  })
})
