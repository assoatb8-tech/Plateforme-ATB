import { z } from 'zod'
import { stripHtmlTags } from '../utils/sanitize.js'

const sanitizedText = (min: number) => z.string().transform(stripHtmlTags).pipe(z.string().min(min))

export const bureauMemberCreateSchema = z.object({
  userId: z.string().uuid(),
  positionFr: sanitizedText(2),
  positionAr: sanitizedText(2),
  facebookUrl: z.string().url(),
})

export type BureauMemberCreateInput = z.infer<typeof bureauMemberCreateSchema>
