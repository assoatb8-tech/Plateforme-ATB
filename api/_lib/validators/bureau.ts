import { z } from 'zod'
import { stripHtmlTags } from '../utils/sanitize.js'

const phoneRegex = /^(\+216)?\d{8}$/
const sanitizedText = (min: number) => z.string().transform(stripHtmlTags).pipe(z.string().min(min))

export const bureauMemberCreateSchema = z.object({
  firstName: sanitizedText(2),
  lastName: sanitizedText(2),
  phone: z.string().regex(phoneRegex),
  email: z.string().email(),
  facebookUrl: z.string().url(),
  photoUrl: z.string().url(),
})

export type BureauMemberCreateInput = z.infer<typeof bureauMemberCreateSchema>
