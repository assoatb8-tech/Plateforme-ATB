import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { Check, Plus, Wallet, X } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Spinner } from '@/components/ui/Spinner'
import {
  useAdminPaymentsList,
  useCreatePayment,
  useUpdatePaymentStatus,
} from '@/features/admin/payments/hooks/useAdminPayments'
import { paymentFormSchema, type PaymentFormValues } from '@/features/admin/payments/validation'
import { fetchUsers } from '@/features/admin/users/services/usersService'
import type { PaymentType } from '@/types/domain'
import { PAYMENT_STATUS_TONE } from '@/utils/statusTones'

export function AdminPaymentsListPage() {
  const { t } = useTranslation()
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('')
  const [type, setType] = useState('')
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [memberSearch, setMemberSearch] = useState('')
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [selectedUserLabel, setSelectedUserLabel] = useState('')
  const [actionError, setActionError] = useState<string | null>(null)

  const { data, isLoading, isError } = useAdminPaymentsList(page, status, type)
  const createMutation = useCreatePayment()
  const updateStatusMutation = useUpdatePaymentStatus()

  const { data: memberResults } = useQuery({
    queryKey: ['admin', 'users', 'search', memberSearch],
    queryFn: () => fetchUsers({ page: 1, search: memberSearch }),
    enabled: memberSearch.trim().length >= 2,
  })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PaymentFormValues>({ resolver: zodResolver(paymentFormSchema) })

  function closeCreateModal() {
    setCreateModalOpen(false)
    setMemberSearch('')
    setSelectedUserId(null)
    setSelectedUserLabel('')
    reset()
  }

  async function onCreateSubmit(values: PaymentFormValues) {
    if (!selectedUserId) {
      setActionError(t('admin.payments.create.memberRequired'))
      return
    }
    setActionError(null)
    try {
      await createMutation.mutateAsync({ userId: selectedUserId, ...values })
      closeCreateModal()
    } catch {
      setActionError(t('admin.payments.actionError'))
    }
  }

  async function handleValidate(id: string) {
    setActionError(null)
    try {
      await updateStatusMutation.mutateAsync({ id, status: 'VALIDATED' })
    } catch {
      setActionError(t('admin.payments.actionError'))
    }
  }

  async function handleReject(id: string) {
    setActionError(null)
    try {
      await updateStatusMutation.mutateAsync({ id, status: 'REJECTED' })
    } catch {
      setActionError(t('admin.payments.actionError'))
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">{t('admin.payments.title')}</h1>
          <p className="text-sm text-slate-500">{t('admin.payments.subtitle')}</p>
        </div>
        <Button type="button" onClick={() => setCreateModalOpen(true)}>
          <Plus size={16} />
          {t('admin.payments.create.action')}
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Select
          aria-label={t('admin.payments.filterStatusLabel')}
          value={status}
          onChange={(event) => {
            setStatus(event.target.value)
            setPage(1)
          }}
          placeholder={t('admin.payments.filterStatusAll')}
          className="sm:max-w-[200px]"
          options={[
            { value: 'PENDING', label: t('admin.payments.status.PENDING') },
            { value: 'VALIDATED', label: t('admin.payments.status.VALIDATED') },
            { value: 'REJECTED', label: t('admin.payments.status.REJECTED') },
          ]}
        />
        <Select
          aria-label={t('admin.payments.filterTypeLabel')}
          value={type}
          onChange={(event) => {
            setType(event.target.value)
            setPage(1)
          }}
          placeholder={t('admin.payments.filterTypeAll')}
          className="sm:max-w-[200px]"
          options={[
            { value: 'MEMBERSHIP', label: t('admin.payments.type.MEMBERSHIP') },
            { value: 'DONATION', label: t('admin.payments.type.DONATION') },
            { value: 'OTHER', label: t('admin.payments.type.OTHER') },
          ]}
        />
      </div>

      {actionError && <p className="text-sm text-error">{actionError}</p>}

      {isLoading && <Spinner label={t('admin.loading')} />}
      {isError && <p className="text-sm text-error">{t('admin.errorGeneric')}</p>}

      {!isLoading && !isError && data && data.payments.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-slate-200 py-20 text-center">
          <Wallet size={40} className="text-slate-300" />
          <p className="text-sm text-slate-500">{t('admin.payments.noPaymentsYet')}</p>
        </div>
      )}

      {!isLoading && data && data.payments.length > 0 && (
        <>
          <Card className="overflow-x-auto p-0">
            <table className="w-full min-w-[680px] text-start text-sm">
              <thead className="border-b border-slate-200 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">{t('admin.payments.columns.member')}</th>
                  <th className="px-4 py-3">{t('admin.payments.columns.amount')}</th>
                  <th className="px-4 py-3">{t('admin.payments.columns.type')}</th>
                  <th className="px-4 py-3">{t('admin.payments.columns.status')}</th>
                  <th className="px-4 py-3">{t('admin.payments.columns.date')}</th>
                  <th className="px-4 py-3 text-end">{t('admin.payments.columns.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {data.payments.map((payment) => (
                  <tr key={payment.id} className="border-b border-slate-100 last:border-0">
                    <td className="px-4 py-3 text-slate-800">
                      {payment.user.memberProfile?.fullName ?? payment.user.email}
                    </td>
                    <td className="px-4 py-3 text-slate-800">{payment.amount}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {t(`admin.payments.type.${payment.paymentType}`)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge tone={PAYMENT_STATUS_TONE[payment.status]}>
                        {t(`admin.payments.status.${payment.status}`)}
                      </StatusBadge>
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {new Date(payment.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      {payment.status === 'PENDING' && (
                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            variant="ghost"
                            aria-label={t('admin.payments.validate')}
                            disabled={updateStatusMutation.isPending}
                            onClick={() => void handleValidate(payment.id)}
                          >
                            <Check size={16} className="text-success" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            aria-label={t('admin.payments.reject')}
                            disabled={updateStatusMutation.isPending}
                            onClick={() => void handleReject(payment.id)}
                          >
                            <X size={16} className="text-error" />
                          </Button>
                          {/* No loading spinner on these two — they're compact icon-only
                              buttons and updateStatusMutation is shared across every row,
                              so a spinner would show on rows the admin didn't click. The
                              existing disabled state already prevents double-submission. */}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          {data.totalPages > 1 && (
            <div className="flex items-center justify-center gap-4">
              <Button
                type="button"
                variant="ghost"
                disabled={page <= 1}
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              >
                {t('events.previousPage')}
              </Button>
              <span className="text-sm text-slate-500">
                {t('events.pageIndicator', { current: page, total: data.totalPages })}
              </span>
              <Button
                type="button"
                variant="ghost"
                disabled={page >= data.totalPages}
                onClick={() => setPage((prev) => Math.min(data.totalPages, prev + 1))}
              >
                {t('events.nextPage')}
              </Button>
            </div>
          )}
        </>
      )}

      <Modal
        open={createModalOpen}
        onClose={closeCreateModal}
        title={t('admin.payments.create.title')}
      >
        <form onSubmit={handleSubmit(onCreateSubmit)} noValidate className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Input
              id="paymentMemberSearch"
              label={t('admin.payments.create.memberSearchLabel')}
              placeholder={t('admin.payments.create.memberSearchPlaceholder')}
              value={selectedUserId ? selectedUserLabel : memberSearch}
              onChange={(event) => {
                setSelectedUserId(null)
                setMemberSearch(event.target.value)
              }}
            />
            {!selectedUserId && memberSearch.trim().length >= 2 && (
              <ul className="max-h-40 overflow-y-auto rounded-xl border border-slate-200">
                {memberResults && memberResults.users.length === 0 && (
                  <li className="px-3 py-2 text-sm text-slate-500">
                    {t('admin.payments.create.noMembersFound')}
                  </li>
                )}
                {memberResults?.users.map((memberOption) => (
                  <li key={memberOption.id}>
                    <button
                      type="button"
                      className="w-full px-3 py-2 text-start text-sm hover:bg-slate-50"
                      onClick={() => {
                        setSelectedUserId(memberOption.id)
                        setSelectedUserLabel(memberOption.fullName ?? memberOption.email)
                        setMemberSearch('')
                      }}
                    >
                      {memberOption.fullName ?? memberOption.email}{' '}
                      <span className="text-slate-400">({memberOption.email})</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <Input
            type="number"
            step="0.01"
            min={0}
            label={t('admin.payments.create.amountLabel')}
            error={errors.amount && t(errors.amount.message ?? 'validation.required')}
            {...register('amount')}
          />
          <Select
            label={t('admin.payments.create.typeLabel')}
            options={(['MEMBERSHIP', 'DONATION', 'OTHER'] as PaymentType[]).map((value) => ({
              value,
              label: t(`admin.payments.type.${value}`),
            }))}
            {...register('paymentType')}
          />

          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={closeCreateModal}>
              {t('admin.payments.create.cancel')}
            </Button>
            <Button type="submit" disabled={isSubmitting} loading={isSubmitting}>
              {t('admin.payments.create.submit')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
