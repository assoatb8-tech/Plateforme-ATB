import { apiRequest } from '@/services/apiClient'
import type { PaymentDto, PaymentsListResponse } from '@/features/admin/payments/types'
import type { PaymentStatus, PaymentType } from '@/types/domain'

export async function fetchPayments(params: {
  page?: number
  status?: PaymentStatus | ''
  type?: PaymentType | ''
}): Promise<PaymentsListResponse> {
  return apiRequest<PaymentsListResponse>('/api/payments', {
    query: {
      page: params.page,
      status: params.status || undefined,
      type: params.type || undefined,
    },
  })
}

export async function createPayment(input: {
  userId: string
  amount: number
  paymentType: PaymentType
}): Promise<PaymentDto> {
  return apiRequest<PaymentDto>('/api/payments', { method: 'POST', body: input })
}

export async function updatePaymentStatus(
  id: string,
  status: 'VALIDATED' | 'REJECTED',
): Promise<PaymentDto> {
  return apiRequest<PaymentDto>(`/api/payments/${id}`, { method: 'PATCH', body: { status } })
}
