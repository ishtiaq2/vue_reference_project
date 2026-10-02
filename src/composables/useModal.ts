import { ref, shallowRef, type Ref } from 'vue'

export interface UseModal<TPayload> {
  readonly isOpen: Ref<boolean>
  /** Whatever was passed to `open`, e.g. the row a confirm dialog is about. */
  readonly payload: Readonly<Ref<TPayload | null>>
  open: (payload: TPayload) => void
  close: () => void
}

/** Open/closed state for a modal, with an optional typed payload. Bind with `v-model="isOpen"`. */
export function useModal<TPayload = void>(): UseModal<TPayload> {
  const isOpen = ref(false)
  const payload = shallowRef<TPayload | null>(null)

  function open(value: TPayload): void {
    payload.value = value
    isOpen.value = true
  }

  function close(): void {
    isOpen.value = false
    payload.value = null
  }

  return { isOpen, payload, open, close }
}
