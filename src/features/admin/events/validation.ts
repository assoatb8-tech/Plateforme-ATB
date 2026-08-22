import { z } from 'zod'

// Frontend mirror of api/validators/event.ts — same shape, messages are
// i18next keys instead of literal English strings (SECURITY.md: validate on
// both sides independently, never trust the frontend alone).

// One row of the "multi-day" day-editor. `id` present means "this is an
// existing EventDay being edited", absent means "a new one" — same
// distinction the server's syncEventDays reconciles by.
const eventDayFormSchema = z
  .object({
    id: z.string().uuid().optional(),
    date: z.string().min(1, 'validation.required'),
    startTime: z.string().min(1, 'validation.required'),
    endTime: z.string().min(1, 'validation.required'),
  })
  .refine((day) => `${day.date}T${day.endTime}` >= `${day.date}T${day.startTime}`, {
    message: 'admin.events.form.dayTimeOrderError',
    path: ['endTime'],
  })

const eventFormSchemaBase = z.object({
  titleFr: z.string().min(2, 'validation.required'),
  titleAr: z.string().min(2, 'validation.required'),
  descriptionFr: z.string().min(5, 'validation.required'),
  descriptionAr: z.string().min(5, 'validation.required'),
  location: z.string().min(2, 'validation.required'),
  // Required only for a single-day event — see the refines below.
  startDate: z
    .string()
    .refine((val) => !val || !Number.isNaN(Date.parse(val)), 'validation.invalidDate')
    .optional(),
  endDate: z
    .string()
    .refine((val) => !val || !Number.isNaN(Date.parse(val)), 'validation.invalidDate')
    .optional(),
  maxParticipants: z.coerce.number().int().positive('validation.required'),
  status: z.enum(['ACTIVE', 'CANCELLED']).optional(),
  facebookPostUrl: z
    .string()
    .trim()
    .optional()
    .refine((val) => !val || z.string().url().safeParse(val).success, 'validation.invalidUrl'),
  bannerUrl: z
    .string()
    .trim()
    .optional()
    .refine((val) => !val || z.string().url().safeParse(val).success, 'validation.invalidUrl'),
  isMultiDay: z.boolean().default(false),
  days: z.array(eventDayFormSchema).optional(),
})

export const eventFormSchema = eventFormSchemaBase
  .refine((data) => data.isMultiDay || (Boolean(data.startDate) && Boolean(data.endDate)), {
    message: 'validation.required',
    path: ['startDate'],
  })
  .refine(
    (data) =>
      data.isMultiDay ||
      !data.startDate ||
      !data.endDate ||
      new Date(data.endDate) >= new Date(data.startDate),
    { message: 'admin.events.form.dateOrderError', path: ['endDate'] },
  )
  .refine((data) => !data.isMultiDay || (Array.isArray(data.days) && data.days.length > 0), {
    message: 'admin.events.form.daysRequiredError',
    path: ['days'],
  })

export type EventFormValues = z.infer<typeof eventFormSchema>

export interface EventDayPayload {
  id?: string
  startAt: string
  endAt: string
}

// What actually goes over the wire — api/_lib/validators/event.ts's
// eventDayInput shape, not the form's separate date/startTime/endTime
// editing fields. Deliberately NOT calling .toISOString() here: the
// existing single-day startDate/endDate inputs already send a bare
// "YYYY-MM-DDTHH:mm" local-time string as-is (see toDatetimeLocalValue
// below) and the server parses it the same way either path — keeping
// multi-day days on that identical convention avoids the two schedule
// modes behaving differently around timezones.
export interface EventSubmitPayload extends Omit<EventFormValues, 'days'> {
  days?: EventDayPayload[]
}

export function toEventSubmitPayload(values: EventFormValues): EventSubmitPayload {
  const { days, startDate, endDate, ...rest } = values
  return {
    ...rest,
    // react-hook-form keeps a field's last value after its input unmounts
    // (no shouldUnregister) — an admin who toggles "multi-day" on after the
    // single-day inputs briefly rendered would otherwise still submit a
    // stale startDate/endDate (even just "") alongside `days`.
    startDate: values.isMultiDay ? undefined : startDate,
    endDate: values.isMultiDay ? undefined : endDate,
    days: values.isMultiDay
      ? (days ?? []).map((day) => ({
          id: day.id,
          startAt: `${day.date}T${day.startTime}`,
          endAt: `${day.date}T${day.endTime}`,
        }))
      : undefined,
  }
}

// Prisma stores startDate/endDate as absolute instants; <input
// type="datetime-local"> needs "YYYY-MM-DDTHH:mm" in the browser's local
// time with no timezone suffix.
export function toDatetimeLocalValue(iso: string): string {
  const date = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

// Same idea, split into the separate date/time fields the day-editor uses.
export function toDateAndTimeValues(iso: string): { date: string; time: string } {
  const combined = toDatetimeLocalValue(iso)
  const [date, time] = combined.split('T')
  return { date, time }
}
