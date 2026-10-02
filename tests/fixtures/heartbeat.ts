import type { Heartbeat, HeartbeatDto } from '@/types/heartbeat'

export function buildHeartbeatDto(overrides: Partial<HeartbeatDto> = {}): HeartbeatDto {
  return {
    status: 'UP',
    timestamp: '2026-01-15T10:00:00.000Z',
    version: '1.0.0',
    ...overrides,
  }
}

export function buildHeartbeat(overrides: Partial<Heartbeat> = {}): Heartbeat {
  return {
    status: 'UP',
    timestamp: new Date('2026-01-15T10:00:00.000Z'),
    version: '1.0.0',
    ...overrides,
  }
}
