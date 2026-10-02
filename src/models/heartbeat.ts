import type { ConnectionState, Heartbeat, HeartbeatDto } from '@/types/heartbeat'
import type { BadgeVariant } from '@/types/ui'
import { assertNever } from '@/utils/assertNever'

export function toHeartbeat(dto: HeartbeatDto): Heartbeat {
  return { status: dto.status, timestamp: new Date(dto.timestamp), version: dto.version }
}

export function connectionLabel(state: ConnectionState): string {
  switch (state) {
    case 'unknown':
      return 'Checking…'
    case 'up':
      return 'Online'
    case 'down':
      return 'Offline'
    default:
      return assertNever(state)
  }
}

export function connectionVariant(state: ConnectionState): BadgeVariant {
  switch (state) {
    case 'unknown':
      return 'neutral'
    case 'up':
      return 'success'
    case 'down':
      return 'danger'
    default:
      return assertNever(state)
  }
}
