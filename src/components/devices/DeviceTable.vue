<script setup lang="ts">
import BaseButton from '@/components/base/BaseButton.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import { deviceStatusLabel, deviceStatusVariant } from '@/models/device'
import type { Device } from '@/types/device'
import { formatDateTime } from '@/utils/formatters'

defineProps<{ devices: readonly Device[] }>()

const emit = defineEmits<{ delete: [device: Device] }>()
</script>

<template>
  <table class="table">
    <caption class="visually-hidden">
      Devices
    </caption>
    <thead>
      <tr>
        <th scope="col">Name</th>
        <th scope="col">Firmware</th>
        <th scope="col">Status</th>
        <th scope="col">Last seen</th>
        <th scope="col"><span class="visually-hidden">Actions</span></th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="device in devices" :key="device.id">
        <th scope="row">{{ device.name }}</th>
        <td>{{ device.firmwareVersion }}</td>
        <td>
          <StatusBadge
            :label="deviceStatusLabel(device.status)"
            :variant="deviceStatusVariant(device.status)"
          />
        </td>
        <td>{{ formatDateTime(device.lastSeen) }}</td>
        <td>
          <BaseButton
            variant="danger"
            :aria-label="`Delete ${device.name}`"
            @click="emit('delete', device)"
          >
            Delete
          </BaseButton>
        </td>
      </tr>
    </tbody>
  </table>
</template>

<style scoped>
.table {
  width: 100%;
  border-collapse: collapse;
  background: var(--color-surface);
}
.table th,
.table td {
  padding: 0.75rem;
  border-bottom: 1px solid var(--color-border);
  text-align: left;
}
.table tbody th {
  font-weight: 600;
}
</style>
