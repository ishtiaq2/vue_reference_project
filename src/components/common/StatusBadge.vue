<script setup lang="ts">
import type { BadgeVariant } from '@/types/ui'

defineProps<{
  label: string
  variant: BadgeVariant
}>()
</script>

<template>
  <span class="badge" :class="`badge--${variant}`">{{ label }}</span>
</template>

<style scoped>
.badge {
  display: inline-block;
  padding: 0.125rem 0.5rem;
  border-radius: 999px;
  font-size: 0.8125rem;
  font-weight: 600;
}
.badge--success {
  color: #14532d;
  background: #dcfce7;
}
.badge--danger {
  color: #7f1d1d;
  background: #fee2e2;
}
.badge--warning {
  color: #78350f;
  background: #fef3c7;
}
.badge--neutral {
  color: #1f2933;
  background: #e5e7eb;
}
</style>
