import { z } from 'zod'

// Server-side validation for admin-authored events. Kept minimal per
// Phase 3 scope (the admin UI itself is out of scope) but still enforced —
// SECURITY.md: never trust client input, even from an ADMIN-authenticated one.

const eventBaseSchema = z.object({
  titleFr: z.string().min(2),
  titleAr: z.string().min(2),
  descriptionFr: z.string().min(5),
  descriptionAr: z.string().min(5),
  location: z.string().min(2),
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
