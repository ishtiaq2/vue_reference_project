<script setup lang="ts">
import { computed } from 'vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import { connectionLabel, connectionVariant } from '@/models/heartbeat'
import type { ConnectionState } from '@/types/heartbeat'
import { formatDateTime } from '@/utils/formatters'

const props = defineProps<{
  connection: ConnectionState
  lastChecked: Date | null
}>()

const tooltip = computed(() =>
  props.lastChecked ? `Last checked ${formatDateTime(props.lastChecked)}` : 'Not checked yet',
)
</script>

<template>
  <span class="heartbeat" data-testid="heartbeat-indicator" role="status" :title="tooltip">
    <StatusBadge :label="connectionLabel(connection)" :variant="connectionVariant(connection)" />
  </span>
</template>
