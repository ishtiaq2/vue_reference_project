import {
  NewDeviceSchema,
  type Device,
  type DeviceDto,
  type DeviceStatus,
  type NewDevice,
  type NewDeviceDto,
} from '@/types/device'
import type { BadgeVariant } from '@/types/ui'
import type { ValidationResult } from '@/types/validation'
import { assertNever } from '@/utils/assertNever'
import { validate } from '@/utils/validation'

/** Wire format -> domain model. The only place that knows the API uses snake_case. */
export function toDevice(dto: DeviceDto): Device {
  return {
    id: dto.id,
    name: dto.name,
    firmwareVersion: dto.firmware_version,
    status: dto.status,
    lastSeen: new Date(dto.last_seen),
  }
}

/** Domain input -> wire format. */
export function toNewDeviceDto(input: NewDevice): NewDeviceDto {
  return { name: input.name, firmware_version: input.firmwareVersion }
}

export function validateNewDevice(input: NewDevice): ValidationResult<NewDevice> {
  return validate(NewDeviceSchema, input)
}

export function deviceStatusLabel(status: DeviceStatus): string {
  switch (status) {
    case 'online':
      return 'Online'
    case 'offline':
      return 'Offline'
    default:
      return assertNever(status)
  }
}

export function deviceStatusVariant(status: DeviceStatus): BadgeVariant {
  switch (status) {
    case 'online':
      return 'success'
    case 'offline':
      return 'danger'
    default:
      return assertNever(status)
  }
}
