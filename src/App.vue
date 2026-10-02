<script setup lang="ts">
import { onBeforeUnmount, onMounted } from 'vue'
import { RouterLink, RouterView } from 'vue-router'
import HeartbeatIndicator from '@/components/heartbeat/HeartbeatIndicator.vue'
import { ROUTE_NAMES } from '@/constants/routes'
import { useHeartbeatStore } from '@/stores/heartbeatStore'
import { APP_TITLE } from '@/router'

const heartbeat = useHeartbeatStore()

onMounted(() => {
  heartbeat.startMonitoring()
})
onBeforeUnmount(() => {
  heartbeat.stopMonitoring()
})
</script>

<template>
  <header class="app-header">
    <span class="app-header__brand">{{ APP_TITLE }}</span>
    <nav class="app-header__nav" aria-label="Main">
      <RouterLink :to="{ name: ROUTE_NAMES.home }">Status</RouterLink>
      <RouterLink :to="{ name: ROUTE_NAMES.devices }">Devices</RouterLink>
    </nav>
    <HeartbeatIndicator
      :connection="heartbeat.connection"
      :last-checked="heartbeat.lastCheckedAt"
    />
  </header>
  <main class="app-main">
    <RouterView />
  </main>
</template>

<style scoped>
.app-header {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 0.75rem var(--space);
  border-bottom: 1px solid var(--color-border);
  background: var(--color-surface);
}
.app-header__brand {
  font-weight: 700;
}
.app-header__nav {
  display: flex;
  flex: 1;
  gap: 1rem;
}
.app-header__nav a.router-link-active {
  font-weight: 700;
}
.app-main {
  max-width: 60rem;
  margin: 0 auto;
  padding: var(--space);
}
</style>
