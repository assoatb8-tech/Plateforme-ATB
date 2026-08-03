import { z } from 'zod'

export const bureauMemberFormSchema = z.object({
  facebookUrl: z.string().url('validation.invalidUrl'),
})

export type BureauMemberFormValues = z.infer<typeof bureauMemberFormSchema>
