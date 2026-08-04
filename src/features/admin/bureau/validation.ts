import { z } from 'zod'

export const bureauMemberFormSchema = z.object({
  positionFr: z.string().min(2, 'validation.required'),
  positionAr: z.string().min(2, 'validation.required'),
  facebookUrl: z.string().url('validation.invalidUrl'),
})

export type BureauMemberFormValues = z.infer<typeof bureauMemberFormSchema>
