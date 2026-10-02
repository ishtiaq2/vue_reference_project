import { mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, type Pinia } from 'pinia'
import { createMemoryHistory, type Router } from 'vue-router'
import App from '@/App.vue'
import { createAppRouter } from '@/router'

export interface MountedApp {
  wrapper: VueWrapper
  router: Router
  pinia: Pinia
}

/** Mounts the real app: real router (in-memory history), real Pinia, real stores and services. */
export async function mountApp(route = '/'): Promise<MountedApp> {
  const pinia = createPinia()
  const router = createAppRouter(createMemoryHistory())
  await router.push(route)
  await router.isReady()
  const wrapper = mount(App, { global: { plugins: [pinia, router] } })
  return { wrapper, router, pinia }
}
