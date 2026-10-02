<script setup lang="ts">
import { reactive, ref } from 'vue'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseInput from '@/components/base/BaseInput.vue'
import { validateNewDevice } from '@/models/device'
import type { NewDevice } from '@/types/device'
import type { FieldErrors } from '@/types/validation'

withDefaults(defineProps<{ submitting?: boolean; serverError?: string | null }>(), {
  submitting: false,
  serverError: null,
})

const emit = defineEmits<{
  submit: [value: NewDevice]
  cancel: []
}>()

const form = reactive<NewDevice>({ name: '', firmwareVersion: '' })
const errors = ref<FieldErrors>({})

function onSubmit(): void {
  const result = validateNewDevice(form)
  if (!result.valid) {
    errors.value = result.errors
    return
  }
  errors.value = {}
  emit('submit', result.value)
}
</script>

<template>
  <form novalidate @submit.prevent="onSubmit">
    <BaseInput v-model="form.name" label="Name" :error="errors.name" />
    <BaseInput
      v-model="form.firmwareVersion"
      label="Firmware version"
      :error="errors.firmwareVersion"
    />
    <p v-if="serverError" class="form__error" role="alert">{{ serverError }}</p>
    <div class="form__actions">
      <BaseButton variant="secondary" :disabled="submitting" @click="emit('cancel')">
        Cancel
      </BaseButton>
      <BaseButton type="submit" :loading="submitting">Add device</BaseButton>
    </div>
  </form>
</template>

<style scoped>
.form__error {
  margin: 0 0 var(--space);
  color: var(--color-danger);
}
.form__actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}
</style>
