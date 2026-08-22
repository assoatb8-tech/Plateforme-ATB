import { z } from 'zod'
import { stripHtmlTags } from '../utils/sanitize.js'

// Server-side validation for admin-authored events. Kept minimal per
// Phase 3 scope (the admin UI itself is out of scope) but still enforced —
// SECURITY.md: never trust client input, even from an ADMIN-authenticated one.

// Strip first, then validate length against the real (post-strip) content
// — a value like "<b>a</b>" should fail min(2), not pass on its
// tag-inflated raw length.
const sanitizedText = (min: number) => z.string().transform(stripHtmlTags).pipe(z.string().min(min))

// Always resolves to `string | null`, never `undefined` — so both create
// and update always explicitly set the column (including clearing it back
// to null when the admin empties the field), rather than Prisma silently
// leaving a previous value in place because the key looked "unset".
const facebookPostUrl = z
  .string()
  .trim()
  .optional()
  .transform((val) => (val ? val : null))
  .refine((val) => val === null || z.string().url().safeParse(val).success, {
    message: 'facebookPostUrl must be a valid URL',
  })

// Same "always resolves to string | null" shape as facebookPostUrl — an
// admin removing the banner should explicitly clear the column, not leave
// a stale value in place because the key looked unset.
const bannerUrl = z
  .string()
  .trim()
  .optional()
  .transform((val) => (val ? val : null))
  .refine((val) => val === null || z.string().url().safeParse(val).success, {
    message: 'bannerUrl must be a valid URL',
  })

const isoDate = z.string().refine((val) => !Number.isNaN(Date.parse(val)), {
  message: 'must be a valid date',
})

// `id` present means "update this existing EventDay in place" (the server
// diffs against it); absent means "create a new one" — see
// api/events/[id].ts's syncEventDays. Never trust a client-supplied id
// belonging to a different event; the handler re-checks that.
const eventDayInput = z
  .object({
    id: z.string().uuid().optional(),
    startAt: isoDate,
    endAt: isoDate,
  })
  .refine((day) => new Date(day.endAt) >= new Date(day.startAt), {
    message: "a day's endAt must be on or after its startAt",
    path: ['endAt'],
  })

export type EventDayInput = z.infer<typeof eventDayInput>

const eventBaseSchema = z.object({
  titleFr: sanitizedText(2),
  titleAr: sanitizedText(2),
  descriptionFr: sanitizedText(5),
  descriptionAr: sanitizedText(5),
  location: sanitizedText(2),
  // Required for a single-day event, ignored for a multi-day one (the
  // server derives them from `days` instead) — see withScheduleCheck.
  startDate: isoDate.optional(),
  endDate: isoDate.optional(),
  maxParticipants: z.number().int().positive(),
  facebookPostUrl,
  bannerUrl,
  isMultiDay: z.boolean().optional().default(false),
  days: z.array(eventDayInput).min(1).max(60).optional(),
})

// `requireSchedule: true` (create) demands a complete, coherent schedule
// one way or the other; `false` (update, always a partial payload) only
// checks whatever combination of fields was actually included.
function withScheduleCheck<T extends z.ZodTypeAny>(schema: T, requireSchedule: boolean) {
  return schema
    .refine(
      (data) => {
        const { isMultiDay, days } = data as { isMultiDay?: boolean; days?: unknown[] }
        if (!requireSchedule || !isMultiDay) return true
        return Array.isArray(days) && days.length > 0
      },
      { message: 'at least one day is required for a multi-day event', path: ['days'] },
    )
    .refine(
      (data) => {
        const { isMultiDay, startDate, endDate } = data as {
          isMultiDay?: boolean
          startDate?: string
          endDate?: string
        }
        if (!requireSchedule || isMultiDay) return true
        return Boolean(startDate) && Boolean(endDate)
      },
      {
        message: 'startDate and endDate are required for a single-day event',
        path: ['startDate'],
      },
    )
    .refine(
      (data) => {
        const { isMultiDay, startDate, endDate } = data as {
          isMultiDay?: boolean
          startDate?: string
          endDate?: string
        }
        if (isMultiDay) return true
        return !startDate || !endDate || new Date(endDate) >= new Date(startDate)
      },
      { message: 'endDate must be on or after startDate', path: ['endDate'] },
    )
}

export const eventCreateSchema = withScheduleCheck(eventBaseSchema, true)

export const eventUpdateSchema = withScheduleCheck(
  eventBaseSchema.partial().extend({
    status: z.enum(['ACTIVE', 'CANCELLED']).optional(),
  }),
  false,
)

export type EventCreateInput = z.infer<typeof eventCreateSchema>
export type EventUpdateInput = z.infer<typeof eventUpdateSchema>

// null explicitly unassigns the current leader — distinct from omitting
// the field, which this endpoint doesn't accept anyway (always required).
export const eventLeaderSchema = z.object({ userId: z.string().uuid().nullable() })

export type EventLeaderInput = z.infer<typeof eventLeaderSchema>

// status: null clears a previously recorded mark back to "not yet taken" —
// same "explicit null, not omission" shape as eventLeaderSchema above.
export const eventAttendanceSchema = z.object({
  registrationId: z.string().uuid(),
  status: z.enum(['PRESENT', 'ABSENT']).nullable(),
})

export type EventAttendanceInput = z.infer<typeof eventAttendanceSchema>

// Body of POST .../register — dayIds only meaningful (and only read) when
// the event is multi-day; omitted entirely for a normal single-day
// registration, exactly as before this feature.
export const eventRegisterSchema = z.object({
  dayIds: z.array(z.string().uuid()).max(60).optional(),
})

export type EventRegisterInput = z.infer<typeof eventRegisterSchema>

// Body of PATCH .../days — changing which day(s) an already-REGISTERED
// member intends to attend, independent of the register/cancel flow.
export const eventDaySelectionSchema = z.object({
  dayIds: z.array(z.string().uuid()).min(1).max(60),
})

export type EventDaySelectionInput = z.infer<typeof eventDaySelectionSchema>
