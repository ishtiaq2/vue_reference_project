<script setup lang="ts">
import { onMounted } from 'vue'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseModal from '@/components/base/BaseModal.vue'
import ApiStateBlock from '@/components/common/ApiStateBlock.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import DeviceForm from '@/components/devices/DeviceForm.vue'
import DeviceTable from '@/components/devices/DeviceTable.vue'
import { useModal } from '@/composables/useModal'
import { useDeviceStore } from '@/stores/deviceStore'
import type { Device, NewDevice } from '@/types/device'
import { pluralize } from '@/utils/formatters'

const store = useDeviceStore()
const addModal = useModal()
const deleteModal = useModal<Device>()

onMounted(() => {
  void store.fetchDevices()
})

function openAddModal(): void {
  store.resetCreate()
  addModal.open()
}

function openDeleteModal(device: Device): void {
  store.resetRemove()
  deleteModal.open(device)
}

async function handleCreate(input: NewDevice): Promise<void> {
  const result = await store.addDevice(input)
  if (result.ok) addModal.close()
}

async function handleConfirmDelete(): Promise<void> {
  const target = deleteModal.payload.value
  if (!target) return
  const result = await store.removeDevice(target.id)
  if (result.ok) deleteModal.close()
}
</script>

<template>
  <section aria-labelledby="devices-title">
    <header class="page-header">
      <div>
        <h1 id="devices-title">Devices</h1>
        <p class="page-header__summary">
          {{ pluralize(store.devices.length, 'device') }}, {{ store.onlineCount }} online
        </p>
      </div>
      <BaseButton @click="openAddModal">Add device</BaseButton>
    </header>

    <ApiStateBlock
      :status="store.listStatus"
      :error="store.listError"
      @retry="store.fetchDevices()"
    >
      <p v-if="store.devices.length === 0" class="empty">No devices yet.</p>
      <DeviceTable v-else :devices="store.devices" @delete="openDeleteModal" />
    </ApiStateBlock>

    <BaseModal v-model="addModal.isOpen.value" title="Add device">
      <DeviceForm
        :submitting="store.createStatus === 'loading'"
        :server-error="store.createError?.message ?? null"
        @submit="handleCreate"
        @cancel="addModal.close()"
      />
    </BaseModal>

    <ConfirmDialog
      v-model="deleteModal.isOpen.value"
      title="Delete device"
      :message="`Delete ${deleteModal.payload.value?.name ?? 'this device'}? This cannot be undone.`"
      confirm-label="Delete"
      danger
      :busy="store.removeStatus === 'loading'"
      :error="store.removeError?.message ?? null"
      @confirm="handleConfirmDelete"
    />
  </section>
</template>

<style scoped>
.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: var(--space);
}
.page-header h1 {
  margin-bottom: 0.25rem;
}
.page-header__summary {
  margin: 0;
  color: var(--color-muted);
}
.empty {
  padding: var(--space);
  border: 1px dashed var(--color-border);
  border-radius: var(--radius);
  color: var(--color-muted);
}
</style>
