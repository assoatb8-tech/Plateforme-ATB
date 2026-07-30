import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Ban, Trash2 } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { Modal } from '@/components/ui/Modal'
import { StatusBadge } from '@/components/ui/StatusBadge'
import {
  useAdminUser,
  useBanUser,
  useDeleteUser,
  useUpdateUserStatus,
} from '@/features/admin/users/hooks/useAdminUsers'
import { banFormSchema, type BanFormValues } from '@/features/admin/users/validation'
import type { UserStatus } from '@/types/domain'
import { USER_STATUS_TONE, PAYMENT_STATUS_TONE } from '@/utils/statusTones'

export function AdminUserDetailPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [banModalOpen, setBanModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  const { data: user, isLoading, isError } = useAdminUser(id)
  const updateStatus = useUpdateUserStatus(id ?? '')
  const banMutation = useBanUser(id ?? '')
  const deleteMutation = useDeleteUser()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<BanFormValues>({ resolver: zodResolver(banFormSchema) })

  async function handleStatusChange(status: UserStatus) {
    setActionError(null)
    try {
      await updateStatus.mutateAsync(status)
    } catch {
      setActionError(t('admin.users.detail.actionError'))
    }
  }

  async function onBanSubmit(values: BanFormValues) {
    setActionError(null)
    try {
      await banMutation.mutateAsync(values.reason)
      setBanModalOpen(false)
      reset()
    } catch {
      setActionError(t('admin.users.detail.actionError'))
    }
  }

  async function handleDeleteConfirm() {
    if (!id) return
    setActionError(null)
    try {
      await deleteMutation.mutateAsync(id)
      navigate('/admin/membres')
    } catch {
      setActionError(t('admin.users.detail.actionError'))
      setDeleteModalOpen(false)
    }
  }

  if (isLoading) {
    return <p className="text-sm text-slate-500">{t('admin.loading')}</p>
  }

  if (isError || !user) {
    return <p className="text-sm text-error">{t('admin.users.detail.notFound')}</p>
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          to="/admin/membres"
          className="mb-2 inline-flex items-center gap-1 text-sm text-primary hover:underline"
        >
          <ArrowLeft size={16} />
          {t('admin.users.detail.back')}
        </Link>
        <h1 className="text-2xl font-semibold text-slate-900">
          {user.memberProfile?.fullName ?? user.email}
        </h1>
      </div>

      {actionError && <p className="text-sm text-error">{actionError}</p>}

      <Card className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {t('admin.users.columns.email')}
            </p>
            <p className="text-sm text-slate-800">{user.email}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {t('admin.users.detail.role')}
            </p>
            <p className="text-sm text-slate-800">{user.role}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {t('admin.users.detail.status')}
            </p>
            <StatusBadge tone={USER_STATUS_TONE[user.status]}>
              {t(`dashboard.status.${user.status}`)}
            </StatusBadge>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {t('admin.users.columns.joined')}
            </p>
            <p className="text-sm text-slate-800">
              {new Date(user.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-end">
          <Select
            id="userStatusSelect"
            label={t('admin.users.detail.changeStatus')}
            value={user.status}
            onChange={(event) => void handleStatusChange(event.target.value as UserStatus)}
            disabled={updateStatus.isPending}
            options={[
              { value: 'ACTIVE', label: t('dashboard.status.ACTIVE') },
              { value: 'PENDING', label: t('dashboard.status.PENDING') },
              { value: 'BANNED', label: t('dashboard.status.BANNED') },
            ]}
            className="sm:max-w-[220px]"
          />
          <Button
            type="button"
            variant="danger"
            onClick={() => setBanModalOpen(true)}
            disabled={user.status === 'BANNED'}
          >
            <Ban size={16} />
            {t('admin.users.detail.banAction')}
          </Button>
          <Button type="button" variant="ghost" onClick={() => setDeleteModalOpen(true)}>
            <Trash2 size={16} />
            {t('admin.users.detail.deleteAction')}
          </Button>
        </div>
      </Card>

      <Card className="flex flex-col gap-3">
        <h2 className="text-base font-semibold text-slate-800">
          {t('admin.users.detail.profileTitle')}
        </h2>
        {!user.memberProfile ? (
          <p className="text-sm text-slate-500">{t('admin.users.detail.noProfile')}</p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field
              label={t('memberForm.fields.phoneMobile')}
              value={user.memberProfile.phoneMobile}
            />
            <Field
              label={t('memberForm.fields.contactEmail')}
              value={user.memberProfile.contactEmail}
            />
            <Field label={t('memberForm.fields.cinNumber')} value={user.memberProfile.cinNumber} />
            <Field label={t('memberForm.fields.address')} value={user.memberProfile.address} />
            <Field
              label={t('memberForm.fields.profession')}
              value={user.memberProfile.profession}
            />
          </div>
        )}
      </Card>

      <Card className="flex flex-col gap-3">
        <h2 className="text-base font-semibold text-slate-800">
          {t('admin.users.detail.paymentsTitle')}
        </h2>
        {user.payments.length === 0 ? (
          <p className="text-sm text-slate-500">{t('admin.users.detail.noPayments')}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[420px] text-start text-sm">
              <thead className="border-b border-slate-200 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="py-2 pe-4">{t('admin.payments.columns.amount')}</th>
                  <th className="py-2 pe-4">{t('admin.payments.columns.type')}</th>
                  <th className="py-2 pe-4">{t('admin.payments.columns.status')}</th>
                  <th className="py-2 pe-4">{t('admin.payments.columns.date')}</th>
                </tr>
              </thead>
              <tbody>
                {user.payments.map((payment) => (
                  <tr key={payment.id} className="border-b border-slate-100 last:border-0">
                    <td className="py-2 pe-4 text-slate-800">{payment.amount}</td>
                    <td className="py-2 pe-4 text-slate-600">
                      {t(`admin.payments.type.${payment.paymentType}`)}
                    </td>
                    <td className="py-2 pe-4">
                      <StatusBadge tone={PAYMENT_STATUS_TONE[payment.status]}>
                        {t(`admin.payments.status.${payment.status}`)}
                      </StatusBadge>
                    </td>
                    <td className="py-2 pe-4 text-slate-500">
                      {new Date(payment.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card className="flex flex-col gap-3">
        <h2 className="text-base font-semibold text-slate-800">
          {t('admin.users.detail.registrationsTitle')}
        </h2>
        {user.eventRegistrations.length === 0 ? (
          <p className="text-sm text-slate-500">{t('admin.users.detail.noRegistrations')}</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {user.eventRegistrations.map((registration) => (
              <li key={registration.id} className="flex items-center justify-between text-sm">
                <span className="text-slate-800">{registration.event.titleFr}</span>
                <span className="text-slate-500">
                  {new Date(registration.event.startDate).toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {user.bans.length > 0 && (
        <Card className="flex flex-col gap-3">
          <h2 className="text-base font-semibold text-slate-800">
            {t('admin.users.detail.bansTitle')}
          </h2>
          <ul className="flex flex-col gap-2">
            {user.bans.map((ban) => (
              <li key={ban.id} className="text-sm text-slate-700">
                <span className="text-slate-500">
                  {new Date(ban.createdAt).toLocaleDateString()} —{' '}
                </span>
                {ban.reason}
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Modal
        open={banModalOpen}
        onClose={() => setBanModalOpen(false)}
        title={t('admin.users.detail.banAction')}
      >
        <form onSubmit={handleSubmit(onBanSubmit)} noValidate className="flex flex-col gap-4">
          <Textarea
            label={t('admin.users.detail.banReason')}
            error={errors.reason && t(errors.reason.message ?? 'validation.required')}
            {...register('reason')}
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setBanModalOpen(false)}>
              {t('admin.users.detail.banCancel')}
            </Button>
            <Button type="submit" variant="danger" disabled={isSubmitting}>
              {t('admin.users.detail.banConfirm')}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title={t('admin.users.detail.deleteConfirmTitle')}
      >
        <p className="text-sm text-slate-600">{t('admin.users.detail.deleteConfirmText')}</p>
        <div className="mt-4 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={() => setDeleteModalOpen(false)}>
            {t('admin.users.detail.deleteCancel')}
          </Button>
          <Button
            type="button"
            variant="danger"
            disabled={deleteMutation.isPending}
            onClick={() => void handleDeleteConfirm()}
          >
            {t('admin.users.detail.deleteConfirm')}
          </Button>
        </div>
      </Modal>
    </div>
  )
}

function Field({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="text-sm text-slate-800">{value ?? '—'}</p>
    </div>
  )
}
