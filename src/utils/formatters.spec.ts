import { describe, expect, it } from 'vitest'
import { formatDateTime, pluralize } from './formatters'

describe('formatDateTime', () => {
  it('formats a date as day, month, year and time (UTC in tests)', () => {
    expect(formatDateTime(new Date('2026-01-15T10:05:09.000Z'))).toBe('15 Jan 2026, 10:05:09')
  })

  it('supports another locale', () => {
    expect(formatDateTime(new Date('2026-01-15T10:05:09.000Z'), 'en-US')).toBe(
      'Jan 15, 2026, 10:05:09 AM',
    )
  })

  it('returns a dash for an invalid date instead of throwing', () => {
    expect(formatDateTime(new Date('not a date'))).toBe('—')
  })
})

describe('pluralize', () => {
  it.each([
    [0, '0 devices'],
    [1, '1 device'],
    [2, '2 devices'],
  ])('pluralize(%i) -> %s', (count, expected) => {
    expect(pluralize(count, 'device')).toBe(expected)
  })

  it('accepts an irregular plural', () => {
    expect(pluralize(2, 'child', 'children')).toBe('2 children')
  })
})
