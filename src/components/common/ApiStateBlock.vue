<script setup lang="ts">
import BaseButton from '@/components/base/BaseButton.vue'
import type { ApiError, RequestStatus } from '@/types/api'

withDefaults(
  defineProps<{
    status: RequestStatus
    error?: ApiError | null
    loadingText?: string
    retryLabel?: string
  }>(),
  { error: null, loadingText: 'Loading…', retryLabel: 'Retry' },
)

const emit = defineEmits<{ retry: [] }>()

defineSlots<{
  /** Rendered when `status` is `success`. */
  default(): unknown
  loading?(): unknown
  error?(props: { error: ApiError | null }): unknown
}>()
</script>

<template>
  <div v-if="status === 'loading'" class="api-state" role="status">
    <slot name="loading">{{ loadingText }}</slot>
  </div>
  <div v-else-if="status === 'failure'" class="api-state api-state--error" role="alert">
    <slot name="error" :error="error">
      <p class="api-state__message">{{ error?.message ?? 'Something went wrong.' }}</p>
    </slot>
    <BaseButton variant="secondary" @click="emit('retry')">{{ retryLabel }}</BaseButton>
  </div>
  <slot v-else-if="status === 'success'" />
</template>

<style scoped>
.api-state {
  padding: var(--space);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  background: var(--color-surface);
}
.api-state--error {
  border-color: var(--color-danger);
}
.api-state__message {
  margin: 0 0 0.75rem;
  color: var(--color-danger);
}
</style>
