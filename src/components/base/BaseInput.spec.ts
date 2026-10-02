import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import BaseInput from './BaseInput.vue'

function mountInput(props: { label?: string; error?: string; modelValue?: string } = {}) {
  return mount(BaseInput, { props: { label: 'Name', modelValue: '', ...props } })
}

describe('BaseInput', () => {
  it('links the label to the input', () => {
    const wrapper = mountInput({ label: 'Firmware version' })

    const label = wrapper.get('label')
    expect(label.text()).toBe('Firmware version')
    expect(label.attributes('for')).toBe(wrapper.get('input').attributes('id'))
  })

  it('shows the model value and emits updates when the user types (v-model)', async () => {
    const wrapper = mountInput({ modelValue: 'abc' })
    expect(wrapper.get('input').element.value).toBe('abc')

    await wrapper.get('input').setValue('abcd')

    expect(wrapper.emitted('update:modelValue')).toEqual([['abcd']])
  })

  it('shows no error by default', () => {
    const wrapper = mountInput()

    expect(wrapper.find('.field__error').exists()).toBe(false)
    expect(wrapper.get('input').attributes('aria-invalid')).toBe('false')
    expect(wrapper.get('input').attributes('aria-describedby')).toBeUndefined()
  })

  it('shows the error and wires it to the input for screen readers', () => {
    const wrapper = mountInput({ error: 'Name is required' })

    const error = wrapper.get('.field__error')
    const input = wrapper.get('input')
    expect(error.text()).toBe('Name is required')
    expect(input.attributes('aria-invalid')).toBe('true')
    expect(input.attributes('aria-describedby')).toBe(error.attributes('id'))
  })
})
