import { createMemoryHistory } from 'vue-router'
import { describe, expect, it } from 'vitest'
import { ROUTE_NAMES } from '@/constants/routes'
import { APP_TITLE, createAppRouter } from './index'

describe('createAppRouter', () => {
  it.each([
    ['/', ROUTE_NAMES.home],
    ['/devices', ROUTE_NAMES.devices],
    ['/does/not/exist', ROUTE_NAMES.notFound],
  ])('resolves %s to the "%s" route', async (path, name) => {
    const router = createAppRouter(createMemoryHistory())

    await router.push(path)

    expect(router.currentRoute.value.name).toBe(name)
  })

  it.each([
    ['/', 'Status'],
    ['/devices', 'Devices'],
    ['/does/not/exist', 'Page not found'],
  ])('sets the document title for %s to "%s"', async (path, title) => {
    const router = createAppRouter(createMemoryHistory())

    await router.push(path)

    expect(document.title).toBe(`${title} · ${APP_TITLE}`)
  })
})
