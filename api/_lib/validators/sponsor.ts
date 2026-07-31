import { z } from 'zod'
import { stripHtmlTags } from '../utils/sanitize.js'

export const sponsorCreateSchema = z.object({
  name: z.string().transform(stripHtmlTags).pipe(z.string().min(2)),
  logoUrl: z.string().url(),
})

export type SponsorCreateInput = z.infer<typeof sponsorCreateSchema>
