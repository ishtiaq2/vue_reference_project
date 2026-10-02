<script setup lang="ts">
import BaseButton from '@/components/base/BaseButton.vue'
import BaseModal from '@/components/base/BaseModal.vue'

withDefaults(
  defineProps<{
    modelValue: boolean
    title: string
    message: string
    confirmLabel?: string
    cancelLabel?: string
    busy?: boolean
    danger?: boolean
    error?: string | null
  }>(),
  { confirmLabel: 'Confirm', cancelLabel: 'Cancel', busy: false, danger: false, error: null },
)

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  confirm: []
}>()
</script>

<template>
  <BaseModal
    :model-value="modelValue"
    :title="title"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <p class="confirm__message">{{ message }}</p>
    <p v-if="error" class="confirm__error" role="alert">{{ error }}</p>
    <template #footer>
      <BaseButton variant="secondary" :disabled="busy" @click="emit('update:modelValue', false)">
        {{ cancelLabel }}
      </BaseButton>
      <BaseButton :variant="danger ? 'danger' : 'primary'" :loading="busy" @click="emit('confirm')">
        {{ confirmLabel }}
      </BaseButton>
    </template>
  </BaseModal>
</template>

<style scoped>
.confirm__message {
  margin: 0;
}
.confirm__error {
  margin: 0.75rem 0 0;
  color: var(--color-danger);
}
</style>
