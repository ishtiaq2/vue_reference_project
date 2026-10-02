import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import type { ApiError, RequestStatus } from '@/types/api'
import ApiStateBlock from './ApiStateBlock.vue'

const error: ApiError = { kind: 'http', status: 500, message: 'Database is down' }

function mountBlock(status: RequestStatus, props: { error?: ApiError | null } = {}, slots = {}) {
  return mount(ApiStateBlock, {
    props: { status, ...props },
    slots: { default: '<p>The data</p>', ...slots },
  })
}

describe('ApiStateBlock', () => {
  it('renders nothing while idle', () => {
    const wrapper = mountBlock('idle')

    expect(wrapper.text()).toBe('')
  })

  it('shows a polite loading message', () => {
    const wrapper = mountBlock('loading')

    expect(wrapper.get('[role="status"]').text()).toBe('Loading…')
    expect(wrapper.text()).not.toContain('The data')
  })

  it('lets the caller replace the loading content', () => {
    const wrapper = mountBlock('loading', {}, { loading: '<span>Spinner</span>' })

    expect(wrapper.get('[role="status"]').text()).toBe('Spinner')
  })

  it('shows the content on success', () => {
    const wrapper = mountBlock('success')

    expect(wrapper.text()).toBe('The data')
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
  })

  it('shows the error message as an alert on failure', () => {
    const wrapper = mountBlock('failure', { error })

    expect(wrapper.get('[role="alert"]').text()).toContain('Database is down')
    expect(wrapper.text()).not.toContain('The data')
  })

  it('falls back to a generic message when there is no error object', () => {
    expect(mountBlock('failure').get('[role="alert"]').text()).toContain('Something went wrong.')
  })

  it('emits retry when the retry button is clicked', async () => {
    const wrapper = mountBlock('failure', { error })

    await wrapper.get('button').trigger('click')

    expect(wrapper.emitted('retry')).toHaveLength(1)
  })

  it('lets the caller render the error itself via a scoped slot', () => {
    const wrapper = mountBlock(
      'failure',
      { error },
      {
        error: `<template #error="{ error }">Custom: {{ error.status }}</template>`,
      },
    )

    expect(wrapper.get('[role="alert"]').text()).toContain('Custom: 500')
  })
})
