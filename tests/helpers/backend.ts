import { expect, type APIRequestContext } from '@playwright/test'

/** Puts the mock backend back to its seed data so every test starts from the same state. */
export async function resetBackend(request: APIRequestContext): Promise<void> {
  const response = await request.post('/api/__mock__/reset')
  expect(response.status()).toBe(204)
}
