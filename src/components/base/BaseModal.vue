<script setup lang="ts">
import { onMounted, useId, useTemplateRef, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    modelValue: boolean
    title: string
    closeOnBackdrop?: boolean
  }>(),
  { closeOnBackdrop: true },
)

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  close: []
}>()

defineSlots<{
  default(): unknown
  footer?(): unknown
}>()

const dialog = useTemplateRef<HTMLDialogElement>('dialog')
const titleId = useId()

/** The native <dialog> provides focus trapping, Escape handling and the backdrop for free. */
function syncWithNative(open: boolean): void {
  const el = dialog.value
  if (!el) return
  if (open && !el.open) el.showModal()
  if (!open && el.open) el.close()
}

function requestClose(): void {
  emit('update:modelValue', false)
  emit('close')
}

/** Escape fires `cancel`; we keep v-model as the single source of truth instead of closing natively. */
function onCancel(event: Event): void {
  event.preventDefault()
  requestClose()
}

/** The backdrop belongs to the <dialog> element, so a click whose target is the dialog itself is outside the panel. */
function onClick(event: MouseEvent): void {
  if (props.closeOnBackdrop && event.target === dialog.value) requestClose()
}

function onNativeClose(): void {
  if (props.modelValue) emit('update:modelValue', false)
}

onMounted(() => syncWithNative(props.modelValue))
watch(() => props.modelValue, syncWithNative, { flush: 'post' })
</script>

<template>
  <dialog
    ref="dialog"
    class="modal"
    :aria-labelledby="titleId"
    @cancel="onCancel"
    @click="onClick"
    @close="onNativeClose"
  >
    <div v-if="modelValue" class="modal__panel">
      <header class="modal__header">
        <h2 :id="titleId" class="modal__title">{{ title }}</h2>
        <button type="button" class="modal__close" aria-label="Close" @click="requestClose">
          &times;
        </button>
      </header>
      <div class="modal__body">
        <slot />
      </div>
      <footer v-if="$slots.footer" class="modal__footer">
        <slot name="footer" />
      </footer>
    </div>
  </dialog>
</template>

<style scoped>
.modal {
  width: min(32rem, 92vw);
  padding: 0;
  border: 0;
  border-radius: var(--radius);
  color: var(--color-text);
  background: var(--color-surface);
  box-shadow: 0 20px 40px rgb(15 23 42 / 0.3);
}
.modal::backdrop {
  background: rgb(15 23 42 / 0.5);
}
.modal__panel {
  padding: var(--space);
}
.modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space);
}
.modal__title {
  margin: 0;
  font-size: 1.125rem;
}
.modal__close {
  border: 0;
  background: transparent;
  font-size: 1.5rem;
  line-height: 1;
  cursor: pointer;
}
.modal__footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: var(--space);
}
</style>
