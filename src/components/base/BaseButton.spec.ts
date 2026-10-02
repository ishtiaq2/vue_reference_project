import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import BaseButton from './BaseButton.vue'

describe('BaseButton', () => {
  it('renders its slot inside a non-submitting button by default', () => {
    const wrapper = mount(BaseButton, { slots: { default: 'Save' } })

    expect(wrapper.text()).toBe('Save')
    expect(wrapper.attributes('type')).toBe('button')
  })

  it('applies the variant class', () => {
    expect(mount(BaseButton, { props: { variant: 'danger' } }).classes()).toContain('btn--danger')
  })

  it('passes native listeners through to the button', async () => {
    const onClick = vi.fn()
    const wrapper = mount(BaseButton, { attrs: { onClick } })

    await wrapper.trigger('click')

    expect(onClick).toHaveBeenCalledOnce()
  })

  it('is disabled and marked busy while loading, and ignores clicks', async () => {
    const onClick = vi.fn()
    const wrapper = mount(BaseButton, { props: { loading: true }, attrs: { onClick } })

    await wrapper.trigger('click')

    expect(wrapper.attributes('disabled')).toBeDefined()
    expect(wrapper.attributes('aria-busy')).toBe('true')
    expect(onClick).not.toHaveBeenCalled()
  })

  it('can be a submit button', () => {
    expect(mount(BaseButton, { props: { type: 'submit' } }).attributes('type')).toBe('submit')
  })
})
