import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import type { ConnectionState } from '@/types/heartbeat'
import HeartbeatIndicator from './HeartbeatIndicator.vue'

describe('HeartbeatIndicator', () => {
  it.each<[ConnectionState, string, string]>([
    ['unknown', 'Checking…', 'badge--neutral'],
    ['up', 'Online', 'badge--success'],
    ['down', 'Offline', 'badge--danger'],
  ])('%s shows "%s"', (connection, text, badgeClass) => {
    const wrapper = mount(HeartbeatIndicator, { props: { connection, lastChecked: null } })

    expect(wrapper.text()).toBe(text)
    expect(wrapper.get('.badge').classes()).toContain(badgeClass)
  })

  it('explains in a tooltip when it was last checked', () => {
    const wrapper = mount(HeartbeatIndicator, {
      props: { connection: 'up', lastChecked: new Date('2026-01-15T10:00:00.000Z') },
    })

    expect(wrapper.attributes('title')).toBe('Last checked 15 Jan 2026, 10:00:00')
  })

  it('says so when it has not checked yet', () => {
    const wrapper = mount(HeartbeatIndicator, {
      props: { connection: 'unknown', lastChecked: null },
    })

    expect(wrapper.attributes('title')).toBe('Not checked yet')
  })
})
