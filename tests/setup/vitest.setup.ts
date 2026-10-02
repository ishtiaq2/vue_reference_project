import { enableAutoUnmount } from '@vue/test-utils'
import { afterAll, afterEach, beforeAll } from 'vitest'
import { server } from '../mocks/server'

// Unmount every component mounted with VTU after each test.
enableAutoUnmount(afterEach)

// jsdom does not implement <dialog>.showModal()/close(); this minimal stand-in keeps BaseModal testable.
// Real focus-trapping and backdrop behaviour is covered by the Playwright tests.
if (typeof HTMLDialogElement.prototype.showModal !== 'function') {
  HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement): void {
    this.setAttribute('open', '')
  }
  HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement): void {
    this.removeAttribute('open')
    this.dispatchEvent(new Event('close'))
  }
}

// Network boundary: any request without a handler fails the test instead of leaving the machine.
beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' })
})
afterEach(() => {
  server.resetHandlers()
})
afterAll(() => {
  server.close()
})
