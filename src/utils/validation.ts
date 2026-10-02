import type { z } from 'zod'
import type { ValidationResult } from '@/types/validation'

/** Runs a zod schema and converts the outcome to a plain, UI-friendly result. */
export function validate<T>(schema: z.ZodType<T>, input: unknown): ValidationResult<T> {
  const parsed = schema.safeParse(input)
  if (parsed.success) return { valid: true, value: parsed.data }

  const errors: Record<string, string> = {}
  for (const issue of parsed.error.issues) {
    const field = String(issue.path[0] ?? '_form')
    errors[field] ??= issue.message
  }
  return { valid: false, errors }
}
