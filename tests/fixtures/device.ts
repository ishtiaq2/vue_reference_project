import type { Device, DeviceDto, NewDevice } from '@/types/device'

export function buildDeviceDto(overrides: Partial<DeviceDto> = {}): DeviceDto {
  return {
    id: 'dev-001',
    name: 'Edge Router 1',
    firmware_version: '1.4.2',
    status: 'online',
    last_seen: '2026-01-15T10:00:00.000Z',
    ...overrides,
  }
}

export function buildDevice(overrides: Partial<Device> = {}): Device {
  return {
    id: 'dev-001',
    name: 'Edge Router 1',
    firmwareVersion: '1.4.2',
    status: 'online',
    lastSeen: new Date('2026-01-15T10:00:00.000Z'),
    ...overrides,
  }
}

export function buildNewDevice(overrides: Partial<NewDevice> = {}): NewDevice {
  return { name: 'Lab Router', firmwareVersion: '1.0.0', ...overrides }
}
