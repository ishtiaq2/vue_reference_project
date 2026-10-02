import { http, HttpResponse } from 'msw'
import { describe, expect, it, vi } from 'vitest'
import { API_PATHS } from '@/constants/api'
import { createStatefulDeviceHandlers, apiUrl } from '@tests/mocks/handlers'
import { server } from '@tests/mocks/server'
import { getButton, getInputByLabel } from '@tests/helpers/dom'
import { mountApp } from '@tests/helpers/mountApp'

/**
 * Integration: the real app (router, Pinia, stores, services, axios) against a faked network.
 * Nothing inside the app is mocked; only the HTTP boundary is.
 */
describe('Devices page', () => {
  it('lists the devices returned by the API', async () => {
    const { wrapper } = await mountApp('/devices')

    await vi.waitFor(() => expect(wrapper.findAll('tbody tr')).toHaveLength(3))
    expect(wrapper.text()).toContain('3 devices, 2 online')
    expect(wrapper.text()).toContain('Core Switch')
  })

  it('adds a device through the dialog and shows it in the table', async () => {
    server.use(...createStatefulDeviceHandlers())
    const { wrapper } = await mountApp('/devices')
    await vi.waitFor(() => expect(wrapper.findAll('tbody tr')).toHaveLength(3))

    await getButton(wrapper, 'Add device').trigger('click')
    const dialog = wrapper.get('dialog[open]')
    await getInputByLabel(dialog, 'Name').setValue('Lab Router')
    await getInputByLabel(dialog, 'Firmware version').setValue('1.0.0')
    await dialog.get('form').trigger('submit')

    await vi.waitFor(() => expect(wrapper.findAll('tbody tr')).toHaveLength(4))
    expect(wrapper.find('dialog[open]').exists()).toBe(false)
    expect(wrapper.text()).toContain('Lab Router')
    expect(wrapper.text()).toContain('4 devices, 2 online')
  })

  it('shows the server error in the dialog when the device is rejected', async () => {
    server.use(
      http.post(apiUrl(API_PATHS.devices), () =>
        HttpResponse.json(
          { message: 'A device named "Lab Router" already exists' },
          { status: 409 },
        ),
      ),
    )
    const { wrapper } = await mountApp('/devices')
    await vi.waitFor(() => expect(wrapper.findAll('tbody tr')).toHaveLength(3))

    await getButton(wrapper, 'Add device').trigger('click')
    const dialog = wrapper.get('dialog[open]')
    await getInputByLabel(dialog, 'Name').setValue('Lab Router')
    await getInputByLabel(dialog, 'Firmware version').setValue('1.0.0')
    await dialog.get('form').trigger('submit')

    await vi.waitFor(() =>
      expect(wrapper.get('dialog[open] [role="alert"]').text()).toBe(
        'A device named "Lab Router" already exists',
      ),
    )
    expect(wrapper.findAll('tbody tr')).toHaveLength(3)
  })

  it('deletes a device after confirmation', async () => {
    server.use(...createStatefulDeviceHandlers())
    const { wrapper } = await mountApp('/devices')
    await vi.waitFor(() => expect(wrapper.findAll('tbody tr')).toHaveLength(3))

    await getButton(wrapper, 'Delete Core Switch').trigger('click')
    await getButton(wrapper.get('dialog[open]'), 'Delete').trigger('click')

    await vi.waitFor(() => expect(wrapper.findAll('tbody tr')).toHaveLength(2))
    expect(wrapper.text()).not.toContain('Core Switch')
    expect(wrapper.find('dialog[open]').exists()).toBe(false)
  })

  it('keeps the device when the confirmation is cancelled', async () => {
    const { wrapper } = await mountApp('/devices')
    await vi.waitFor(() => expect(wrapper.findAll('tbody tr')).toHaveLength(3))

    await getButton(wrapper, 'Delete Core Switch').trigger('click')
    await getButton(wrapper.get('dialog[open]'), 'Cancel').trigger('click')

    expect(wrapper.findAll('tbody tr')).toHaveLength(3)
  })

  it('shows an error when loading fails and recovers on retry', async () => {
    server.use(
      http.get(
        apiUrl(API_PATHS.devices),
        () => HttpResponse.json({ message: 'Database is down' }, { status: 500 }),
        {
          once: true,
        },
      ),
    )
    const { wrapper } = await mountApp('/devices')

    await vi.waitFor(() =>
      expect(wrapper.get('[role="alert"]').text()).toContain('Database is down'),
    )
    await getButton(wrapper, 'Retry').trigger('click')

    await vi.waitFor(() => expect(wrapper.findAll('tbody tr')).toHaveLength(3))
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
  })
})
