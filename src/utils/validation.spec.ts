import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { validate } from './validation'

const schema = z.object({
  name: z.string().min(3, 'Too short'),
  age: z.number().min(18, 'Must be an adult'),
})

describe('validate', () => {
  it('returns the parsed value when the input is valid', () => {
    expect(validate(schema, { name: 'Ada', age: 36 })).toEqual({
      valid: true,
      value: { name: 'Ada', age: 36 },
    })
  })

  it('returns one message per field when the input is invalid', () => {
    expect(validate(schema, { name: 'Al', age: 5 })).toEqual({
      valid: false,
      errors: { name: 'Too short', age: 'Must be an adult' },
    })
  })

  it('keeps only the first message of a field with several problems', () => {
    const strict = z.object({ code: z.string().min(5, 'Too short').regex(/^\d+$/, 'Digits only') })

    expect(validate(strict, { code: 'ab' })).toEqual({
      valid: false,
      errors: { code: 'Too short' },
    })
  })

  it('reports a problem with the whole input under _form', () => {
    expect(validate(schema, 'not an object')).toEqual({
      valid: false,
      errors: { _form: expect.any(String) as string },
    })
  })
})
