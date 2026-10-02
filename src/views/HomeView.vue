<script setup lang="ts">
import BaseButton from '@/components/base/BaseButton.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import { connectionLabel, connectionVariant } from '@/models/heartbeat'
import { useHeartbeatStore } from '@/stores/heartbeatStore'
import { formatDateTime } from '@/utils/formatters'

const heartbeat = useHeartbeatStore()
</script>

<template>
  <section aria-labelledby="home-title">
    <h1 id="home-title">System status</h1>
    <dl class="status-list">
      <div class="status-list__row">
        <dt>Connection</dt>
        <dd>
          <StatusBadge
            :label="connectionLabel(heartbeat.connection)"
            :variant="connectionVariant(heartbeat.connection)"
          />
        </dd>
      </div>
      <div class="status-list__row">
        <dt>Server version</dt>
        <dd data-testid="server-version">{{ heartbeat.latest?.version ?? '—' }}</dd>
      </div>
      <div class="status-list__row">
        <dt>Last checked</dt>
        <dd data-testid="last-checked">
          {{ heartbeat.lastCheckedAt ? formatDateTime(heartbeat.lastCheckedAt) : '—' }}
        </dd>
      </div>
    </dl>
    <p v-if="heartbeat.lastError" class="status-error" role="alert">
      {{ heartbeat.lastError.message }}
    </p>
    <BaseButton :loading="heartbeat.isChecking" @click="heartbeat.checkNow()">Check now</BaseButton>
  </section>
</template>

<style scoped>
.status-list {
  display: grid;
  gap: 0.5rem;
  max-width: 28rem;
  margin: 0 0 var(--space);
  padding: var(--space);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  background: var(--color-surface);
}
.status-list__row {
  display: flex;
  justify-content: space-between;
}
.status-list dt {
  color: var(--color-muted);
}
.status-list dd {
  margin: 0;
}
.status-error {
  color: var(--color-danger);
}
</style>
