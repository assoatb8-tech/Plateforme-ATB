import { z } from 'zod'

// There is no online payment gateway (see supabase/sql/002_rls_policies.sql
// comment: "cotisations recorded and validated by an administrator") — this
// is how a Payment row gets created at all.
export const paymentCreateSchema = z.object({
  userId: z.string().uuid(),
  amount: z.number().positive(),
  paymentType: z.enum(['MEMBERSHIP', 'DONATION', 'OTHER']),
})

export const paymentStatusUpdateSchema = z.object({
  status: z.enum(['VALIDATED', 'REJECTED']),
})

export type PaymentCreateInput = z.infer<typeof paymentCreateSchema>
export type PaymentStatusUpdateInput = z.infer<typeof paymentStatusUpdateSchema>
