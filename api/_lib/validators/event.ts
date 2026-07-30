import { z } from 'zod'
import { stripHtmlTags } from '../utils/sanitize.js'

// Server-side validation for admin-authored events. Kept minimal per
// Phase 3 scope (the admin UI itself is out of scope) but still enforced —
// SECURITY.md: never trust client input, even from an ADMIN-authenticated one.

// Strip first, then validate length against the real (post-strip) content
// — a value like "<b>a</b>" should fail min(2), not pass on its
// tag-inflated raw length.
const sanitizedText = (min: number) => z.string().transform(stripHtmlTags).pipe(z.string().min(min))

const eventBaseSchema = z.object({
  titleFr: sanitizedText(2),
  titleAr: sanitizedText(2),
  descriptionFr: sanitizedText(5),
  descriptionAr: sanitizedText(5),
  location: sanitizedText(2),
  startDate: z.string().refine((val) => !Number.isNaN(Date.parse(val))),
  endDate: z.string().refine((val) => !Number.isNaN(Date.parse(val))),
  maxParticipants: z.number().int().positive(),
})

function withDateOrderCheck<T extends z.ZodTypeAny>(schema: T) {
  return schema.refine(
    (data) => {
      const { startDate, endDate } = data as { startDate?: string; endDate?: string }
      return !startDate || !endDate || new Date(endDate) >= new Date(startDate)
    },
    { message: 'endDate must be on or after startDate', path: ['endDate'] },
  )
}

export const eventCreateSchema = withDateOrderCheck(eventBaseSchema)

export const eventUpdateSchema = withDateOrderCheck(
  eventBaseSchema.partial().extend({
    status: z.enum(['ACTIVE', 'CANCELLED']).optional(),
  }),
)

export type EventCreateInput = z.infer<typeof eventCreateSchema>
export type EventUpdateInput = z.infer<typeof eventUpdateSchema>
