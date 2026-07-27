import { z } from 'zod'

// Mirrors api/validators/payment.ts's paymentCreateSchema minus userId,
// which the create-payment modal manages separately as a member-search
// selection rather than a raw form field.
export const paymentFormSchema = z.object({
  amount: z.coerce.number().positive('validation.required'),
  paymentType: z.enum(['MEMBERSHIP', 'DONATION', 'OTHER']),
})
export type PaymentFormValues = z.infer<typeof paymentFormSchema>
