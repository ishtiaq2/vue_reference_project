import { mount } from '@vue/test-utils'
import { defineComponent } from 'vue'

/**
 * Runs a composable inside a real component so lifecycle hooks and effect scopes work.
 * Call `unmount()` to test cleanup.
 */
export function withSetup<T>(composable: () => T): { result: T; unmount: () => void } {
  const captured: { value?: T; set: boolean } = { set: false }
  const wrapper = mount(
    defineComponent({
      setup() {
        captured.value = composable()
        captured.set = true
        return () => null
      },
    }),
  )
  if (!captured.set) throw new Error('withSetup: the composable did not run')
  return { result: captured.value as T, unmount: () => wrapper.unmount() }
}
