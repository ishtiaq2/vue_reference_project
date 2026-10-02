import { createRouter, createWebHistory, type Router, type RouterHistory } from 'vue-router'
import { routes } from './routes'

export const APP_TITLE = 'Vue Reference App'

/** Factory so tests can pass an in-memory history. */
export function createAppRouter(
  history: RouterHistory = createWebHistory(import.meta.env.BASE_URL),
): Router {
  const router = createRouter({ history, routes: [...routes] })

  router.afterEach((to) => {
    document.title = `${to.meta.title} · ${APP_TITLE}`
  })

  return router
}
