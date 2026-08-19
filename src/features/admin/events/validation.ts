import { z } from 'zod'

// Frontend mirror of api/validators/event.ts — same shape, messages are
// i18next keys instead of literal English strings (SECURITY.md: validate on
// both sides independently, never trust the frontend alone).
const eventFormSchemaBase = z.object({
  titleFr: z.string().min(2, 'validation.required'),
  titleAr: z.string().min(2, 'validation.required'),
  descriptionFr: z.string().min(5, 'validation.required'),
  descriptionAr: z.string().min(5, 'validation.required'),
  location: z.string().min(2, 'validation.required'),
  startDate: z.string().refine((val) => !Number.isNaN(Date.parse(val)), 'validation.invalidDate'),
  endDate: z.string().refine((val) => !Number.isNaN(Date.parse(val)), 'validation.invalidDate'),
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
})

export const eventFormSchema = eventFormSchemaBase.refine(
  (data) => new Date(data.endDate) >= new Date(data.startDate),
  { message: 'admin.events.form.dateOrderError', path: ['endDate'] },
)

export type EventFormValues = z.infer<typeof eventFormSchema>

// Prisma stores startDate/endDate as absolute instants; <input
// type="datetime-local"> needs "YYYY-MM-DDTHH:mm" in the browser's local
// time with no timezone suffix.
export function toDatetimeLocalValue(iso: string): string {
  const date = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}
