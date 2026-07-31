import { z } from 'zod'

// Messages are i18next translation keys, not literal text — components
// resolve them with t() so validation stays bilingual.

export const loginSchema = z.object({
  email: z.string().email('validation.emailInvalid'),
  password: z.string().min(1, 'validation.required'),
})
export type LoginFormValues = z.infer<typeof loginSchema>

export const registerSchema = z
  .object({
    firstName: z.string().min(2, 'validation.required'),
    lastName: z.string().min(2, 'validation.required'),
    email: z.string().email('validation.emailInvalid'),
    password: z.string().min(8, 'validation.passwordMin'),
    confirmPassword: z.string().min(8, 'validation.passwordMin'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'validation.passwordMismatch',
    path: ['confirmPassword'],
  })
export type RegisterFormValues = z.infer<typeof registerSchema>

export const forgotPasswordSchema = z.object({
  email: z.string().email('validation.emailInvalid'),
})
export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>

export const resetPasswordSchema = z
  .object({
    password: z.string().min(8, 'validation.passwordMin'),
    confirmPassword: z.string().min(8, 'validation.passwordMin'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'validation.passwordMismatch',
    path: ['confirmPassword'],
  })
export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>
