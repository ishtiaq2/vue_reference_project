<script setup lang="ts">
import { computed, useId } from 'vue'

const props = defineProps<{
  label: string
  error?: string | undefined
}>()

const model = defineModel<string>({ required: true })

const id = useId()
const errorId = computed(() => `${id}-error`)
const hasError = computed(() => props.error !== undefined)
</script>

<template>
  <div class="field">
    <label :for="id" class="field__label">{{ label }}</label>
    <input
      :id="id"
      v-model="model"
      class="field__input"
      :class="{ 'field__input--invalid': hasError }"
      type="text"
      autocomplete="off"
      :aria-invalid="hasError"
      :aria-describedby="hasError ? errorId : undefined"
    />
    <p v-if="hasError" :id="errorId" class="field__error">{{ error }}</p>
  </div>
</template>

<style scoped>
.field {
  display: grid;
  gap: 0.25rem;
  margin-bottom: var(--space);
}
.field__label {
  font-weight: 600;
}
.field__input {
  padding: 0.5rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  font: inherit;
}
.field__input--invalid {
  border-color: var(--color-danger);
}
.field__error {
  margin: 0;
  color: var(--color-danger);
  font-size: 0.875rem;
}
</style>
