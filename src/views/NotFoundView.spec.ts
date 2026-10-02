import { mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { describe, expect, it } from 'vitest'
import { routes } from '@/router/routes'
import NotFoundView from './NotFoundView.vue'

describe('NotFoundView', () => {
  it('explains the problem and links back home', async () => {
    const router = createRouter({ history: createMemoryHistory(), routes: [...routes] })
    await router.push('/')
    const wrapper = mount(NotFoundView, { global: { plugins: [router] } })

    expect(wrapper.get('h1').text()).toBe('Page not found')
    expect(wrapper.get('a').attributes('href')).toBe('/')
  })
})
