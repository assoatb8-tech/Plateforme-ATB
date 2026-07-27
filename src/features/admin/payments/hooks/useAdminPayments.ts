import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createPayment,
  fetchPayments,
  updatePaymentStatus,
} from '@/features/admin/payments/services/paymentsService'
import type { PaymentStatus, PaymentType } from '@/types/domain'

export const adminPaymentsKeys = {
  all: ['admin', 'payments'] as const,
  list: (page: number, status: string, type: string) =>
    ['admin', 'payments', 'list', page, status, type] as const,
}

export function useAdminPaymentsList(page: number, status: string, type: string) {
  return useQuery({
    queryKey: adminPaymentsKeys.list(page, status, type),
    queryFn: () =>
      fetchPayments({
        page,
        status: status as PaymentStatus | '',
        type: type as PaymentType | '',
      }),
    placeholderData: keepPreviousData,
  })
}

function useInvalidatePaymentsQueries() {
  const queryClient = useQueryClient()
  return () => {
    void queryClient.invalidateQueries({ queryKey: adminPaymentsKeys.all })
    void queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] })
    void queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
  }
}

export function useCreatePayment() {
  const invalidate = useInvalidatePaymentsQueries()
  return useMutation({
    mutationFn: (input: { userId: string; amount: number; paymentType: PaymentType }) =>
      createPayment(input),
    onSuccess: invalidate,
  })
}

export function useUpdatePaymentStatus() {
  const invalidate = useInvalidatePaymentsQueries()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'VALIDATED' | 'REJECTED' }) =>
      updatePaymentStatus(id, status),
    onSuccess: invalidate,
  })
}
