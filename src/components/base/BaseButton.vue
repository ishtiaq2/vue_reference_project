<script setup lang="ts">
import type { ButtonVariant } from '@/types/ui'

withDefaults(
  defineProps<{
    variant?: ButtonVariant
    type?: 'button' | 'submit' | 'reset'
    disabled?: boolean
    loading?: boolean
  }>(),
  { variant: 'primary', type: 'button', disabled: false, loading: false },
)
</script>

<template>
  <button
    :type="type"
    class="btn"
    :class="`btn--${variant}`"
    :disabled="disabled || loading"
    :aria-busy="loading"
  >
    <slot />
  </button>
</template>

<style scoped>
.btn {
  padding: 0.5rem 1rem;
  border: 1px solid transparent;
  border-radius: var(--radius);
  font: inherit;
  cursor: pointer;
}
.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.btn--primary {
  color: #fff;
  background: var(--color-primary);
}
.btn--primary:hover:not(:disabled) {
  background: var(--color-primary-hover);
}
.btn--secondary {
  color: var(--color-text);
  background: var(--color-surface);
  border-color: var(--color-border);
}
.btn--danger {
  color: #fff;
  background: var(--color-danger);
}
.btn--danger:hover:not(:disabled) {
  background: var(--color-danger-hover);
}
</style>
