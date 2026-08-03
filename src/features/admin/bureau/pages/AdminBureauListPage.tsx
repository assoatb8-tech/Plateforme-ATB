import { useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import { Plus, Trash2, UserRound, Users } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { SkeletonCards } from '@/components/ui/SkeletonCards'
import { useBureauMembers } from '@/features/bureau/hooks/useBureau'
import {
  useCreateBureauMember,
  useDeleteBureauMember,
} from '@/features/admin/bureau/hooks/useAdminBureau'
import {
  bureauMemberFormSchema,
  type BureauMemberFormValues,
} from '@/features/admin/bureau/validation'
import {
  uploadBureauPhoto,
  validateBureauPhotoFile,
} from '@/features/admin/bureau/services/adminBureauService'

export function AdminBureauListPage() {
  const { t } = useTranslation()
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoError, setPhotoError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { data: members, isLoading, isError } = useBureauMembers()
  const createMutation = useCreateBureauMember()
  const deleteMutation = useDeleteBureauMember()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BureauMemberFormValues>({ resolver: zodResolver(bureauMemberFormSchema) })

  function closeCreateModal() {
    setCreateModalOpen(false)
    setPhotoFile(null)
    setPhotoError(null)
    reset()
  }

  function handleFileChange(file: File | undefined) {
    setPhotoError(null)
    if (!file) {
      setPhotoFile(null)
      return
    }
    const validationError = validateBureauPhotoFile(file)
    if (validationError) {
      setPhotoError(t(validationError))
      setPhotoFile(null)
      return
    }
    setPhotoFile(file)
  }

  async function onCreateSubmit(values: BureauMemberFormValues) {
    if (!photoFile) {
      setPhotoError(t('admin.bureau.create.photoRequired'))
      return
    }
    setActionError(null)
    try {
      const photoUrl = await uploadBureauPhoto(photoFile)
      await createMutation.mutateAsync({ ...values, photoUrl })
      closeCreateModal()
    } catch {
      setActionError(t('admin.bureau.actionError'))
    }
  }

  async function handleDeleteConfirm() {
    if (!pendingDeleteId) return
    setActionError(null)
    try {
      await deleteMutation.mutateAsync(pendingDeleteId)
      setPendingDeleteId(null)
    } catch {
      setActionError(t('admin.bureau.actionError'))
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">{t('admin.bureau.title')}</h1>
          <p className="text-sm text-slate-500">{t('admin.bureau.subtitle')}</p>
        </div>
        <Button type="button" onClick={() => setCreateModalOpen(true)}>
          <Plus size={16} />
          {t('admin.bureau.create.action')}
        </Button>
      </div>

      {actionError && <p className="text-sm text-error">{actionError}</p>}

      {isLoading && <SkeletonCards count={3} />}
      {isError && <p className="text-sm text-error">{t('admin.errorGeneric')}</p>}

      {!isLoading && !isError && members && members.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-slate-200 py-20 text-center">
          <Users size={40} className="text-slate-300" />
          <p className="text-sm text-slate-500">{t('admin.bureau.noneYet')}</p>
        </div>
      )}

      {!isLoading && members && members.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {members.map((member) => (
            <Card key={member.id} className="flex items-center gap-4">
              <img
                src={member.photoUrl}
                alt=""
                className="h-12 w-12 shrink-0 rounded-full object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-800">
                  {member.firstName} {member.lastName}
                </p>
                <p className="truncate text-xs text-slate-500">{member.phone}</p>
                <p className="truncate text-xs text-slate-500">{member.email}</p>
              </div>
              <Button
                type="button"
                variant="ghost"
                aria-label={t('admin.bureau.deleteAction')}
                onClick={() => setPendingDeleteId(member.id)}
              >
                <Trash2 size={16} className="text-error" />
              </Button>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={createModalOpen}
        onClose={closeCreateModal}
        title={t('admin.bureau.create.title')}
      >
        <form onSubmit={handleSubmit(onCreateSubmit)} noValidate className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">
              {t('admin.bureau.create.photoLabel')}
              <span className="text-error" aria-hidden="true">
                {' '}
                *
              </span>
            </label>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 px-4 py-6 text-sm text-slate-500 hover:border-primary hover:text-primary"
            >
              <UserRound size={18} />
              {photoFile ? photoFile.name : t('admin.bureau.create.photoCta')}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(event) => handleFileChange(event.target.files?.[0])}
            />
            {photoError && <p className="text-sm text-error">{photoError}</p>}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              required
              label={t('admin.bureau.create.firstNameLabel')}
              error={errors.firstName && t(errors.firstName.message ?? 'validation.required')}
              {...register('firstName')}
            />
            <Input
              required
              label={t('admin.bureau.create.lastNameLabel')}
              error={errors.lastName && t(errors.lastName.message ?? 'validation.required')}
              {...register('lastName')}
            />
          </div>
          <Input
            type="tel"
            required
            label={t('admin.bureau.create.phoneLabel')}
            error={errors.phone && t(errors.phone.message ?? 'validation.required')}
            {...register('phone')}
          />
          <Input
            type="email"
            required
            label={t('admin.bureau.create.emailLabel')}
            error={errors.email && t(errors.email.message ?? 'validation.required')}
            {...register('email')}
          />
          <Input
            type="url"
            required
            placeholder="https://facebook.com/..."
            label={t('admin.bureau.create.facebookLabel')}
            error={errors.facebookUrl && t(errors.facebookUrl.message ?? 'validation.required')}
            {...register('facebookUrl')}
          />

          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={closeCreateModal}>
              {t('admin.bureau.create.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending}
              loading={createMutation.isPending}
            >
              {t('admin.bureau.create.submit')}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={pendingDeleteId !== null}
        onClose={() => setPendingDeleteId(null)}
        title={t('admin.bureau.deleteConfirmTitle')}
      >
        <p className="text-sm text-slate-600">{t('admin.bureau.deleteConfirmText')}</p>
        <div className="mt-4 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={() => setPendingDeleteId(null)}>
            {t('admin.bureau.deleteCancel')}
          </Button>
          <Button
            type="button"
            variant="danger"
            disabled={deleteMutation.isPending}
            loading={deleteMutation.isPending}
            onClick={() => void handleDeleteConfirm()}
          >
            {t('admin.bureau.deleteConfirm')}
          </Button>
        </div>
      </Modal>
    </div>
  )
}
