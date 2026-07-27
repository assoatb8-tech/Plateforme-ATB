import { z } from 'zod'

// Messages are i18next translation keys, resolved with t() by the form —
// mirrors src/features/auth/validation.ts.
export const banFormSchema = z.object({
  reason: z.string().min(3, 'validation.required'),
})
export type BanFormValues = z.infer<typeof banFormSchema>
