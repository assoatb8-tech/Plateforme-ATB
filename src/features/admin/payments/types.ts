import type { PaymentStatus, PaymentType } from '@/types/domain'

export interface PaymentUserSummaryDto {
  id: string
  email: string
  memberProfile: { fullName: string } | null
}

export interface PaymentDto {
  id: string
  userId: string
  amount: string
  paymentType: PaymentType
  status: PaymentStatus
  validatedBy: string | null
  validatedAt: string | null
  createdAt: string
  user: PaymentUserSummaryDto
}

export interface PaymentsListResponse {
  payments: PaymentDto[]
  page: number
  pageSize: number
  total: number
  totalPages: number
}
