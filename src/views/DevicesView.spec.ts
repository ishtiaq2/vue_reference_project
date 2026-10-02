import { createTestingPinia } from '@pinia/testing'
import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import { fail, ok } from '@/utils/result'
import { useDeviceStore } from '@/stores/deviceStore'
import type { ApiError } from '@/types/api'
import { buildDevice } from '@tests/fixtures/device'
import { getButton, getInputByLabel } from '@tests/helpers/dom'
import DevicesView from './DevicesView.vue'

const devices = [
  buildDevice({ id: 'a', name: 'Alpha', status: 'online' }),
  buildDevice({ id: 'b', name: 'Beta', status: 'offline' }),
]
const serverError: ApiError = {
  kind: 'http',
  status: 409,
  message: 'A device named "Alpha" already exists',
}

function mountView(arrange: (store: ReturnType<typeof useDeviceStore>) => void = () => undefined) {
  const pinia = createTestingPinia({ createSpy: vi.fn })
  const store = useDeviceStore(pinia)
  arrange(store)
  const wrapper = mount(DevicesView, { global: { plugins: [pinia] } })
  return { wrapper, store }
}

const loaded = (store: ReturnType<typeof useDeviceStore>): void => {
  store.$patch({ devices, listStatus: 'success' })
}

describe('DevicesView', () => {
  it('loads the devices when it appears', () => {
    const { store } = mountView()

    expect(store.fetchDevices).toHaveBeenCalledOnce()
  })

  describe('list', () => {
    it('shows a row per device and a summary', () => {
      const { wrapper } = mountView(loaded)

      expect(wrapper.findAll('tbody tr')).toHaveLength(2)
      expect(wrapper.text()).toContain('2 devices, 1 online')
    })

    it('shows an empty state when there are no devices', () => {
      const { wrapper } = mountView((store) => {
        store.$patch({ devices: [], listStatus: 'success' })
      })

      expect(wrapper.text()).toContain('No devices yet.')
      expect(wrapper.find('table').exists()).toBe(false)
    })

    it('shows a loading indicator', () => {
      const { wrapper } = mountView((store) => {
        store.$patch({ listStatus: 'loading' })
      })

      expect(wrapper.get('[role="status"]').text()).toBe('Loading…')
    })

    it('shows the error and retries loading on request', async () => {
      const { wrapper, store } = mountView((s) => {
        s.$patch({
          listStatus: 'failure',
          listError: { kind: 'network', message: 'Cannot reach the server.' },
        })
      })
      expect(wrapper.get('[role="alert"]').text()).toContain('Cannot reach the server.')

      await getButton(wrapper, 'Retry').trigger('click')

      expect(store.fetchDevices).toHaveBeenCalledTimes(2)
    })
  })

  describe('adding a device', () => {
    async function openAddDialog(wrapper: ReturnType<typeof mountView>['wrapper']) {
      await getButton(wrapper, 'Add device').trigger('click')
      return wrapper.get('dialog[open]')
    }

    it('opens a dialog with an empty form and clears previous errors', async () => {
      const { wrapper, store } = mountView(loaded)

      const dialog = await openAddDialog(wrapper)

      expect(dialog.get('h2').text()).toBe('Add device')
      expect(store.resetCreate).toHaveBeenCalledOnce()
    })

    it('submits the form values and closes the dialog on success', async () => {
      const { wrapper, store } = mountView(loaded)
      vi.mocked(store.addDevice).mockResolvedValue(ok(buildDevice({ id: 'new' })))
      const dialog = await openAddDialog(wrapper)
      await getInputByLabel(dialog, 'Name').setValue('Lab Router')
      await getInputByLabel(dialog, 'Firmware version').setValue('1.0.0')

      await dialog.get('form').trigger('submit')
      await flushPromises()

      expect(store.addDevice).toHaveBeenCalledWith({ name: 'Lab Router', firmwareVersion: '1.0.0' })
      expect(wrapper.find('dialog[open]').exists()).toBe(false)
    })

    it('does not call the store when the form is invalid', async () => {
      const { wrapper, store } = mountView(loaded)
      const dialog = await openAddDialog(wrapper)

      await dialog.get('form').trigger('submit')

      expect(store.addDevice).not.toHaveBeenCalled()
      expect(dialog.findAll('.field__error')).toHaveLength(2)
    })

    it('keeps the dialog open when the server rejects the device', async () => {
      const { wrapper, store } = mountView(loaded)
      vi.mocked(store.addDevice).mockResolvedValue(fail(serverError))
      const dialog = await openAddDialog(wrapper)
      await getInputByLabel(dialog, 'Name').setValue('Alpha')
      await getInputByLabel(dialog, 'Firmware version').setValue('1.0.0')

      await dialog.get('form').trigger('submit')
      await flushPromises()

      expect(wrapper.find('dialog[open]').exists()).toBe(true)
    })

    it('shows the server error inside the dialog', async () => {
      const { wrapper } = mountView((store) => {
        loaded(store)
        store.$patch({ createError: serverError })
      })

      const dialog = await openAddDialog(wrapper)

      expect(dialog.get('[role="alert"]').text()).toBe('A device named "Alpha" already exists')
    })

    it('closes when dismissed with the close button', async () => {
      const { wrapper, store } = mountView(loaded)
      const dialog = await openAddDialog(wrapper)

      await getButton(dialog, 'Close').trigger('click')

      expect(wrapper.find('dialog[open]').exists()).toBe(false)
      expect(store.addDevice).not.toHaveBeenCalled()
    })

    it('closes without saving when cancelled', async () => {
      const { wrapper, store } = mountView(loaded)
      const dialog = await openAddDialog(wrapper)

      await getButton(dialog, 'Cancel').trigger('click')

      expect(wrapper.find('dialog[open]').exists()).toBe(false)
      expect(store.addDevice).not.toHaveBeenCalled()
    })
  })

  describe('deleting a device', () => {
    async function openDeleteDialog(wrapper: ReturnType<typeof mountView>['wrapper']) {
      await getButton(wrapper, 'Delete Beta').trigger('click')
      return wrapper.get('dialog[open]')
    }

    it('asks for confirmation naming the device', async () => {
      const { wrapper, store } = mountView(loaded)

      const dialog = await openDeleteDialog(wrapper)

      expect(dialog.text()).toContain('Delete Beta?')
      expect(store.removeDevice).not.toHaveBeenCalled()
      expect(store.resetRemove).toHaveBeenCalledOnce()
    })

    it('deletes the device and closes the dialog once confirmed', async () => {
      const { wrapper, store } = mountView(loaded)
      vi.mocked(store.removeDevice).mockResolvedValue(ok(undefined))
      const dialog = await openDeleteDialog(wrapper)

      await getButton(dialog, 'Delete').trigger('click')
      await flushPromises()

      expect(store.removeDevice).toHaveBeenCalledExactlyOnceWith('b')
      expect(wrapper.find('dialog[open]').exists()).toBe(false)
    })

    it('never deletes anything when a confirmation arrives without a selected device', async () => {
      const { wrapper, store } = mountView(loaded)

      wrapper.getComponent(ConfirmDialog).vm.$emit('confirm')
      await flushPromises()

      expect(store.removeDevice).not.toHaveBeenCalled()
    })

    it('does nothing when cancelled', async () => {
      const { wrapper, store } = mountView(loaded)
      const dialog = await openDeleteDialog(wrapper)

      await getButton(dialog, 'Cancel').trigger('click')

      expect(store.removeDevice).not.toHaveBeenCalled()
      expect(wrapper.find('dialog[open]').exists()).toBe(false)
    })

    it('keeps the dialog open and shows the error when deleting fails', async () => {
      const { wrapper, store } = mountView(loaded)
      vi.mocked(store.removeDevice).mockResolvedValue(
        fail({ kind: 'http', status: 500, message: 'Server error' }),
      )
      store.$patch({ removeError: { kind: 'http', status: 500, message: 'Server error' } })
      const dialog = await openDeleteDialog(wrapper)

      await getButton(dialog, 'Delete').trigger('click')
      await flushPromises()

      expect(wrapper.find('dialog[open]').exists()).toBe(true)
      expect(wrapper.get('dialog[open] [role="alert"]').text()).toBe('Server error')
    })
  })
})
