import { z } from 'zod'

export const bureauMemberCreateSchema = z.object({
  userId: z.string().uuid(),
  facebookUrl: z.string().url(),
})

export type BureauMemberCreateInput = z.infer<typeof bureauMemberCreateSchema>
