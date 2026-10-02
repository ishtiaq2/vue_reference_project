import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import BaseModal from './BaseModal.vue'

function mountModal(props: { modelValue: boolean; closeOnBackdrop?: boolean }, footer?: string) {
  return mount(BaseModal, {
    props: { title: 'Edit device', ...props },
    slots: { default: '<p>Body text</p>', ...(footer ? { footer } : {}) },
  })
}

describe('BaseModal', () => {
  it('is closed and renders no content while modelValue is false', () => {
    const wrapper = mountModal({ modelValue: false })

    expect(wrapper.get('dialog').attributes('open')).toBeUndefined()
    expect(wrapper.text()).toBe('')
  })

  it('opens as a modal when mounted with modelValue true', () => {
    const wrapper = mountModal({ modelValue: true })

    expect(wrapper.get('dialog').attributes('open')).toBeDefined()
    expect(wrapper.text()).toContain('Body text')
  })

  it('opens and closes when modelValue changes', async () => {
    const wrapper = mountModal({ modelValue: false })

    await wrapper.setProps({ modelValue: true })
    expect(wrapper.get('dialog').attributes('open')).toBeDefined()

    await wrapper.setProps({ modelValue: false })
    expect(wrapper.get('dialog').attributes('open')).toBeUndefined()
  })

  it('is labelled by its title', () => {
    const wrapper = mountModal({ modelValue: true })

    const title = wrapper.get('h2')
    expect(title.text()).toBe('Edit device')
    expect(wrapper.get('dialog').attributes('aria-labelledby')).toBe(title.attributes('id'))
  })

  it('renders the footer slot only when one is given', () => {
    expect(mountModal({ modelValue: true }).find('footer').exists()).toBe(false)
    expect(mountModal({ modelValue: true }, '<button>OK</button>').get('footer').text()).toBe('OK')
  })

  it('asks to close when the close button is clicked', async () => {
    const wrapper = mountModal({ modelValue: true })

    await wrapper.get('button[aria-label="Close"]').trigger('click')

    expect(wrapper.emitted('update:modelValue')).toEqual([[false]])
    expect(wrapper.emitted('close')).toHaveLength(1)
  })

  it('asks to close on Escape, and prevents the browser from closing it on its own', async () => {
    const wrapper = mountModal({ modelValue: true })
    const cancel = new Event('cancel', { cancelable: true })

    wrapper.get('dialog').element.dispatchEvent(cancel)

    expect(cancel.defaultPrevented).toBe(true)
    expect(wrapper.emitted('update:modelValue')).toEqual([[false]])
  })

  it('asks to close when the backdrop is clicked', async () => {
    const wrapper = mountModal({ modelValue: true })

    await wrapper.get('dialog').trigger('click')

    expect(wrapper.emitted('close')).toHaveLength(1)
  })

  it('does not close when the panel itself is clicked', async () => {
    const wrapper = mountModal({ modelValue: true })

    await wrapper.get('.modal__panel').trigger('click')

    expect(wrapper.emitted('close')).toBeUndefined()
  })

  it('ignores backdrop clicks when closeOnBackdrop is false', async () => {
    const wrapper = mountModal({ modelValue: true, closeOnBackdrop: false })

    await wrapper.get('dialog').trigger('click')

    expect(wrapper.emitted('close')).toBeUndefined()
  })

  it('keeps v-model in sync when the dialog is closed natively', () => {
    const wrapper = mountModal({ modelValue: true })

    wrapper.get('dialog').element.dispatchEvent(new Event('close'))

    expect(wrapper.emitted('update:modelValue')).toEqual([[false]])
  })
})
