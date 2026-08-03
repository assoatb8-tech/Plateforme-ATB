import { z } from 'zod'

const phoneRegex = /^(\+216)?\d{8}$/

export const bureauMemberFormSchema = z.object({
  firstName: z.string().min(2, 'validation.required'),
  lastName: z.string().min(2, 'validation.required'),
  phone: z.string().regex(phoneRegex, 'validation.phoneInvalid'),
  email: z.string().email('validation.emailInvalid'),
  facebookUrl: z.string().url('validation.invalidUrl'),
})

export type BureauMemberFormValues = z.infer<typeof bureauMemberFormSchema>
