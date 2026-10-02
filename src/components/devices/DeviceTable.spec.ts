import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { buildDevice } from '@tests/fixtures/device'
import { getButton } from '@tests/helpers/dom'
import DeviceTable from './DeviceTable.vue'

const devices = [
  buildDevice({ id: 'a', name: 'Alpha', firmwareVersion: '1.0.0', status: 'online' }),
  buildDevice({ id: 'b', name: 'Beta', firmwareVersion: '2.0.0', status: 'offline' }),
]

describe('DeviceTable', () => {
  it('renders one row per device with its details', () => {
    const wrapper = mount(DeviceTable, { props: { devices } })

    const rows = wrapper.findAll('tbody tr')
    expect(rows).toHaveLength(2)
    expect(rows[0]?.text()).toContain('Alpha')
    expect(rows[0]?.text()).toContain('1.0.0')
    expect(rows[0]?.text()).toContain('Online')
    expect(rows[0]?.text()).toContain('15 Jan 2026, 10:00:00')
    expect(rows[1]?.text()).toContain('Offline')
  })

  it('renders only the header when there are no devices', () => {
    const wrapper = mount(DeviceTable, { props: { devices: [] } })

    expect(wrapper.findAll('tbody tr')).toHaveLength(0)
    expect(wrapper.findAll('thead th')).toHaveLength(5)
  })

  it('emits delete with the device of the clicked row', async () => {
    const wrapper = mount(DeviceTable, { props: { devices } })

    await getButton(wrapper, 'Delete Beta').trigger('click')

    expect(wrapper.emitted('delete')).toEqual([[devices[1]]])
  })

  it('is accessible: has a caption and column headers', () => {
    const wrapper = mount(DeviceTable, { props: { devices } })

    expect(wrapper.get('caption').text()).toBe('Devices')
    expect(wrapper.findAll('th[scope="col"]').length).toBeGreaterThan(0)
  })
})
