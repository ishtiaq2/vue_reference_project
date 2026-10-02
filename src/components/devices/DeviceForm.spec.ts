import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { getButton, getInputByLabel } from '@tests/helpers/dom'
import DeviceForm from './DeviceForm.vue'

describe('DeviceForm', () => {
  it('emits the trimmed values when they are valid', async () => {
    const wrapper = mount(DeviceForm)
    await getInputByLabel(wrapper, 'Name').setValue('  Lab Router ')
    await getInputByLabel(wrapper, 'Firmware version').setValue('1.2.3')

    await wrapper.get('form').trigger('submit')

    expect(wrapper.emitted('submit')).toEqual([[{ name: 'Lab Router', firmwareVersion: '1.2.3' }]])
  })

  it('shows an error per invalid field and does not emit', async () => {
    const wrapper = mount(DeviceForm)
    await getInputByLabel(wrapper, 'Name').setValue('ab')

    await wrapper.get('form').trigger('submit')

    const errors = wrapper.findAll('.field__error').map((e) => e.text())
    expect(errors).toEqual([
      'Name must be at least 3 characters',
      'Firmware version must look like 1.2.3',
    ])
    expect(wrapper.emitted('submit')).toBeUndefined()
  })

  it('clears the errors once the input becomes valid', async () => {
    const wrapper = mount(DeviceForm)
    await wrapper.get('form').trigger('submit')
    expect(wrapper.findAll('.field__error')).toHaveLength(2)

    await getInputByLabel(wrapper, 'Name').setValue('Lab Router')
    await getInputByLabel(wrapper, 'Firmware version').setValue('1.0.0')
    await wrapper.get('form').trigger('submit')

    expect(wrapper.findAll('.field__error')).toHaveLength(0)
  })

  it('emits cancel', async () => {
    const wrapper = mount(DeviceForm)

    await getButton(wrapper, 'Cancel').trigger('click')

    expect(wrapper.emitted('cancel')).toHaveLength(1)
  })

  it('disables the buttons while submitting', () => {
    const wrapper = mount(DeviceForm, { props: { submitting: true } })

    expect(getButton(wrapper, 'Cancel').attributes('disabled')).toBeDefined()
    expect(getButton(wrapper, 'Add device').attributes('disabled')).toBeDefined()
  })

  it('shows an error from the server', () => {
    const wrapper = mount(DeviceForm, {
      props: { serverError: 'A device named "Lab" already exists' },
    })

    expect(wrapper.get('[role="alert"]').text()).toBe('A device named "Lab" already exists')
  })
})
