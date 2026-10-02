<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { ROUTE_NAMES } from '@/constants/routes'
</script>

<template>
  <section aria-labelledby="not-found-title">
    <h1 id="not-found-title">Page not found</h1>
    <p>The page you are looking for does not exist.</p>
    <RouterLink :to="{ name: ROUTE_NAMES.home }">Back to status</RouterLink>
  </section>
</template>
