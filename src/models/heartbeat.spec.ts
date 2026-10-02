import { describe, expect, it } from 'vitest'
import { buildHeartbeat, buildHeartbeatDto } from '@tests/fixtures/heartbeat'
import type { ConnectionState } from '@/types/heartbeat'
import { connectionLabel, connectionVariant, toHeartbeat } from './heartbeat'

describe('toHeartbeat', () => {
  it('parses the timestamp into a Date', () => {
    expect(toHeartbeat(buildHeartbeatDto({ version: '2.1.0' }))).toEqual(
      buildHeartbeat({ version: '2.1.0' }),
    )
  })
})

describe('connection presentation', () => {
  it.each<[ConnectionState, string, string]>([
    ['unknown', 'Checking…', 'neutral'],
    ['up', 'Online', 'success'],
    ['down', 'Offline', 'danger'],
  ])('%s -> label %s, variant %s', (state, label, variant) => {
    expect(connectionLabel(state)).toBe(label)
    expect(connectionVariant(state)).toBe(variant)
  })

  it('throws for an unknown state', () => {
    expect(() => connectionLabel('weird' as ConnectionState)).toThrow('Unexpected value')
    expect(() => connectionVariant('weird' as ConnectionState)).toThrow('Unexpected value')
  })
})
