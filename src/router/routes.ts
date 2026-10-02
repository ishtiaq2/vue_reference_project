import type { RouteRecordRaw } from 'vue-router'
import { ROUTE_NAMES } from '@/constants/routes'

/** Views are lazy-loaded so each page is its own chunk. */
export const routes: readonly RouteRecordRaw[] = [
  {
    path: '/',
    name: ROUTE_NAMES.home,
    component: () => import('@/views/HomeView.vue'),
    meta: { title: 'Status' },
  },
  {
    path: '/devices',
    name: ROUTE_NAMES.devices,
    component: () => import('@/views/DevicesView.vue'),
    meta: { title: 'Devices' },
  },
  {
    path: '/:pathMatch(.*)*',
    name: ROUTE_NAMES.notFound,
    component: () => import('@/views/NotFoundView.vue'),
    meta: { title: 'Page not found' },
  },
]
