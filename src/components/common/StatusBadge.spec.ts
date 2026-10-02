import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import type { BadgeVariant } from '@/types/ui'
import StatusBadge from './StatusBadge.vue'

describe('StatusBadge', () => {
  it.each<BadgeVariant>(['success', 'danger', 'warning', 'neutral'])(
    'renders the %s variant',
    (variant) => {
      const wrapper = mount(StatusBadge, { props: { label: 'Label', variant } })

      expect(wrapper.text()).toBe('Label')
      expect(wrapper.classes()).toContain(`badge--${variant}`)
    },
  )
})
