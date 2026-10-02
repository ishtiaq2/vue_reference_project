import type { DOMWrapper } from '@vue/test-utils'

/** What `wrapper.get()` returns. */
type Found<T extends Element> = Omit<DOMWrapper<T>, 'exists'>

/** Anything you can search inside: a mounted component (VueWrapper) or an element found in one. */
interface Container {
  findAll: <T extends Element = Element>(selector: string) => DOMWrapper<T>[]
  get: <T extends Element = Element>(selector: string) => Found<T>
}

/** Finds a button by its visible text or aria-label, like a user would. Throws a readable error if missing. */
export function getButton(root: Container, name: string): DOMWrapper<HTMLButtonElement> {
  const buttons = root.findAll<HTMLButtonElement>('button')
  const match = buttons.find(
    (button) => button.text() === name || button.attributes('aria-label') === name,
  )
  if (!match) {
    const available = buttons.map((b) => b.text() || b.attributes('aria-label'))
    throw new Error(`No button "${name}". Buttons found: ${available.join(', ') || 'none'}`)
  }
  return match
}

/** Finds a text input by its label text. */
export function getInputByLabel(root: Container, labelText: string): Found<HTMLInputElement> {
  const label = root.findAll('label').find((l) => l.text() === labelText)
  const id = label?.attributes('for')
  if (!label || !id) throw new Error(`No label "${labelText}"`)
  return root.get<HTMLInputElement>(`[id="${id}"]`)
}
