import { describe, expect, it } from 'vitest'
import { buildDevice, buildDeviceDto, buildNewDevice } from '@tests/fixtures/device'
import type { DeviceStatus } from '@/types/device'
import {
  deviceStatusLabel,
  deviceStatusVariant,
  toDevice,
  toNewDeviceDto,
  validateNewDevice,
} from './device'

describe('toDevice', () => {
  it('maps snake_case wire fields to the camelCase domain model and parses the date', () => {
    expect(
      toDevice(
        buildDeviceDto({ firmware_version: '2.0.1', last_seen: '2026-02-01T08:30:00.000Z' }),
      ),
    ).toEqual(
      buildDevice({ firmwareVersion: '2.0.1', lastSeen: new Date('2026-02-01T08:30:00.000Z') }),
    )
  })
})

describe('toNewDeviceDto', () => {
  it('maps the form input to the wire format', () => {
    expect(
      toNewDeviceDto(buildNewDevice({ name: 'Lab Router', firmwareVersion: '1.0.0' })),
    ).toEqual({
      name: 'Lab Router',
      firmware_version: '1.0.0',
    })
  })
})

describe('validateNewDevice', () => {
  it('accepts valid input and returns it trimmed', () => {
    expect(validateNewDevice({ name: ' Lab Router ', firmwareVersion: '1.0.0' })).toEqual({
      valid: true,
      value: { name: 'Lab Router', firmwareVersion: '1.0.0' },
    })
  })

  it.each([
    ['a too short name', { name: 'ab' }, 'name', 'Name must be at least 3 characters'],
    ['a too long name', { name: 'x'.repeat(51) }, 'name', 'Name must be at most 50 characters'],
    ['a blank name', { name: '   ' }, 'name', 'Name must be at least 3 characters'],
    [
      'a bad firmware version',
      { firmwareVersion: '1.0' },
      'firmwareVersion',
      'Firmware version must look like 1.2.3',
    ],
  ])('rejects %s', (_label, override, field, message) => {
    const result = validateNewDevice(buildNewDevice(override))

    expect(result).toEqual({ valid: false, errors: { [field]: message } })
  })

  it('reports every invalid field at once', () => {
    const result = validateNewDevice({ name: '', firmwareVersion: '' })

    expect(result.valid).toBe(false)
    expect(result.valid ? [] : Object.keys(result.errors).sort()).toEqual([
      'firmwareVersion',
      'name',
    ])
  })
})

describe('device status presentation', () => {
  it.each<[DeviceStatus, string, string]>([
    ['online', 'Online', 'success'],
    ['offline', 'Offline', 'danger'],
  ])('%s -> label %s, variant %s', (status, label, variant) => {
    expect(deviceStatusLabel(status)).toBe(label)
    expect(deviceStatusVariant(status)).toBe(variant)
  })

  it('throws for a status the types do not know about (bad data from the network)', () => {
    expect(() => deviceStatusLabel('sleeping' as DeviceStatus)).toThrow('Unexpected value')
    expect(() => deviceStatusVariant('sleeping' as DeviceStatus)).toThrow('Unexpected value')
  })
})
