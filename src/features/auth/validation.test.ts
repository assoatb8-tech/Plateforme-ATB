import { describe, expect, it } from 'vitest'
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
} from './validation'

describe('loginSchema', () => {
  it('accepts a valid email and non-empty password', () => {
    expect(loginSchema.safeParse({ email: 'a@b.com', password: 'x' }).success).toBe(true)
  })

  it('rejects a malformed email', () => {
    expect(loginSchema.safeParse({ email: 'not-an-email', password: 'x' }).success).toBe(false)
  })

  it('rejects an empty password', () => {
    expect(loginSchema.safeParse({ email: 'a@b.com', password: '' }).success).toBe(false)
  })
})

const validRegister = {
  firstName: 'Adherent',
  lastName: 'Test',
  email: 'a@b.com',
  password: 'password123',
  confirmPassword: 'password123',
}

describe('registerSchema', () => {
  it('accepts a fully valid registration', () => {
    expect(registerSchema.safeParse(validRegister).success).toBe(true)
  })

  it('rejects when password and confirmPassword differ', () => {
    const result = registerSchema.safeParse({ ...validRegister, confirmPassword: 'different' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]?.path).toEqual(['confirmPassword'])
    }
  })

  it('rejects a password shorter than 8 characters', () => {
    const result = registerSchema.safeParse({
      ...validRegister,
      password: 'short',
      confirmPassword: 'short',
    })
    expect(result.success).toBe(false)
  })

  it('rejects a firstName shorter than 2 characters', () => {
    expect(registerSchema.safeParse({ ...validRegister, firstName: 'A' }).success).toBe(false)
  })

  it('rejects a missing lastName', () => {
    const { lastName: _omit, ...withoutLastName } = validRegister
    expect(registerSchema.safeParse(withoutLastName).success).toBe(false)
  })
})

describe('forgotPasswordSchema', () => {
  it('accepts a valid email', () => {
    expect(forgotPasswordSchema.safeParse({ email: 'a@b.com' }).success).toBe(true)
  })

  it('rejects a malformed email', () => {
    expect(forgotPasswordSchema.safeParse({ email: 'nope' }).success).toBe(false)
  })
})

describe('resetPasswordSchema', () => {
  it('accepts matching passwords of sufficient length', () => {
    const result = resetPasswordSchema.safeParse({
      password: 'newpassword1',
      confirmPassword: 'newpassword1',
    })
    expect(result.success).toBe(true)
  })

  it('rejects mismatched passwords', () => {
    const result = resetPasswordSchema.safeParse({
      password: 'newpassword1',
      confirmPassword: 'somethingelse',
    })
    expect(result.success).toBe(false)
  })
})
