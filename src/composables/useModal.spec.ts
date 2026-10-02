import { describe, expect, it } from 'vitest'
import { useModal } from './useModal'

describe('useModal', () => {
  it('starts closed with no payload', () => {
    const modal = useModal<string>()

    expect(modal.isOpen.value).toBe(false)
    expect(modal.payload.value).toBeNull()
  })

  it('opens with a payload and clears it on close', () => {
    const modal = useModal<{ id: number }>()

    modal.open({ id: 7 })
    expect(modal.isOpen.value).toBe(true)
    expect(modal.payload.value).toEqual({ id: 7 })

    modal.close()
    expect(modal.isOpen.value).toBe(false)
    expect(modal.payload.value).toBeNull()
  })

  it('opens without arguments when no payload type is given', () => {
    const modal = useModal()

    modal.open()

    expect(modal.isOpen.value).toBe(true)
  })
})
