import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { getButton } from '@tests/helpers/dom'
import ConfirmDialog from './ConfirmDialog.vue'

function mountDialog(props: Record<string, unknown> = {}) {
  return mount(ConfirmDialog, {
    props: { modelValue: true, title: 'Delete device', message: 'Delete Edge Router 1?', ...props },
  })
}

describe('ConfirmDialog', () => {
  it('shows the title and message', () => {
    const wrapper = mountDialog()

    expect(wrapper.get('h2').text()).toBe('Delete device')
    expect(wrapper.text()).toContain('Delete Edge Router 1?')
  })

  it('emits confirm when the confirm button is clicked', async () => {
    const wrapper = mountDialog({ confirmLabel: 'Delete' })

    await getButton(wrapper, 'Delete').trigger('click')

    expect(wrapper.emitted('confirm')).toHaveLength(1)
  })

  it('asks to close when cancelled', async () => {
    const wrapper = mountDialog()

    await getButton(wrapper, 'Cancel').trigger('click')

    expect(wrapper.emitted('update:modelValue')).toEqual([[false]])
    expect(wrapper.emitted('confirm')).toBeUndefined()
  })

  it('asks to close when the dialog is dismissed with its close button', async () => {
    const wrapper = mountDialog()

    await getButton(wrapper, 'Close').trigger('click')

    expect(wrapper.emitted('update:modelValue')).toEqual([[false]])
    expect(wrapper.emitted('confirm')).toBeUndefined()
  })

  it('uses custom labels', () => {
    const wrapper = mountDialog({ confirmLabel: 'Yes, delete', cancelLabel: 'Keep it' })

    expect(getButton(wrapper, 'Yes, delete').exists()).toBe(true)
    expect(getButton(wrapper, 'Keep it').exists()).toBe(true)
  })

  it('disables both buttons while busy', () => {
    const wrapper = mountDialog({ busy: true })

    expect(getButton(wrapper, 'Cancel').attributes('disabled')).toBeDefined()
    expect(getButton(wrapper, 'Confirm').attributes('disabled')).toBeDefined()
  })

  it('shows an error as an alert', () => {
    const wrapper = mountDialog({ error: 'Device is in use' })

    expect(wrapper.get('[role="alert"]').text()).toBe('Device is in use')
  })

  it('styles the confirm button as dangerous when asked', () => {
    const wrapper = mountDialog({ danger: true })

    expect(getButton(wrapper, 'Confirm').classes()).toContain('btn--danger')
  })

  it('renders nothing while closed', () => {
    expect(mountDialog({ modelValue: false }).text()).toBe('')
  })
})
