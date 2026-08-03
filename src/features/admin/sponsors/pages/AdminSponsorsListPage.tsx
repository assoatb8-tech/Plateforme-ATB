import { useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Building2, Plus, Trash2 } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { SkeletonCards } from '@/components/ui/SkeletonCards'
import { useSponsors } from '@/features/sponsors/hooks/useSponsors'
import {
  useCreateSponsor,
  useDeleteSponsor,
} from '@/features/admin/sponsors/hooks/useAdminSponsors'
import {
  uploadSponsorLogo,
  validateLogoFile,
} from '@/features/admin/sponsors/services/adminSponsorsService'

interface CreateSponsorFormValues {
  name: string
}

export function AdminSponsorsListPage() {
  const { t } = useTranslation()
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoError, setLogoError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { data: sponsors, isLoading, isError } = useSponsors()
  const createMutation = useCreateSponsor()
  const deleteMutation = useDeleteSponsor()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateSponsorFormValues>()

  function closeCreateModal() {
    setCreateModalOpen(false)
    setLogoFile(null)
    setLogoError(null)
    reset()
  }

  function handleFileChange(file: File | undefined) {
    setLogoError(null)
    if (!file) {
      setLogoFile(null)
      return
    }
    const validationError = validateLogoFile(file)
    if (validationError) {
      setLogoError(t(validationError))
      setLogoFile(null)
      return
    }
    setLogoFile(file)
  }

  async function onCreateSubmit(values: CreateSponsorFormValues) {
    if (!logoFile) {
      setLogoError(t('admin.sponsors.create.logoRequired'))
      return
    }
    setActionError(null)
    try {
      const logoUrl = await uploadSponsorLogo(logoFile)
      await createMutation.mutateAsync({ name: values.name, logoUrl })
      closeCreateModal()
    } catch {
      setActionError(t('admin.sponsors.actionError'))
    }
  }

  async function handleDeleteConfirm() {
    if (!pendingDeleteId) return
    setActionError(null)
    try {
      await deleteMutation.mutateAsync(pendingDeleteId)
      setPendingDeleteId(null)
    } catch {
      setActionError(t('admin.sponsors.actionError'))
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">{t('admin.sponsors.title')}</h1>
          <p className="text-sm text-slate-500">{t('admin.sponsors.subtitle')}</p>
        </div>
        <Button type="button" onClick={() => setCreateModalOpen(true)}>
          <Plus size={16} />
          {t('admin.sponsors.create.action')}
        </Button>
      </div>

      {actionError && <p className="text-sm text-error">{actionError}</p>}

      {isLoading && <SkeletonCards count={3} />}
      {isError && <p className="text-sm text-error">{t('admin.errorGeneric')}</p>}

      {!isLoading && !isError && sponsors && sponsors.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-slate-200 py-20 text-center">
          <Building2 size={40} className="text-slate-300" />
          <p className="text-sm text-slate-500">{t('admin.sponsors.noSponsorsYet')}</p>
        </div>
      )}

      {!isLoading && sponsors && sponsors.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sponsors.map((sponsor) => (
            <Card key={sponsor.id} className="flex items-center gap-4">
              <img
                src={sponsor.logoUrl}
                alt={sponsor.name}
                className="h-12 w-12 shrink-0 rounded-lg object-contain"
              />
              <span className="flex-1 truncate text-sm font-medium text-slate-800">
                {sponsor.name}
              </span>
              <Button
                type="button"
                variant="ghost"
                aria-label={t('admin.sponsors.deleteAction')}
                onClick={() => setPendingDeleteId(sponsor.id)}
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
        title={t('admin.sponsors.create.title')}
      >
        <form onSubmit={handleSubmit(onCreateSubmit)} noValidate className="flex flex-col gap-4">
          <Input
            required
            label={t('admin.sponsors.create.nameLabel')}
            error={errors.name && t(errors.name.message ?? 'validation.required')}
            {...register('name', { required: 'validation.required', minLength: 2 })}
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">
              {t('admin.sponsors.create.logoLabel')}
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
              <Building2 size={18} />
              {logoFile ? logoFile.name : t('admin.sponsors.create.logoCta')}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              className="hidden"
              onChange={(event) => handleFileChange(event.target.files?.[0])}
            />
            {logoError && <p className="text-sm text-error">{logoError}</p>}
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={closeCreateModal}>
              {t('admin.sponsors.create.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending}
              loading={createMutation.isPending}
            >
              {t('admin.sponsors.create.submit')}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={pendingDeleteId !== null}
        onClose={() => setPendingDeleteId(null)}
        title={t('admin.sponsors.deleteConfirmTitle')}
      >
        <p className="text-sm text-slate-600">{t('admin.sponsors.deleteConfirmText')}</p>
        <div className="mt-4 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={() => setPendingDeleteId(null)}>
            {t('admin.sponsors.deleteCancel')}
          </Button>
          <Button
            type="button"
            variant="danger"
            disabled={deleteMutation.isPending}
            loading={deleteMutation.isPending}
            onClick={() => void handleDeleteConfirm()}
          >
            {t('admin.sponsors.deleteConfirm')}
          </Button>
        </div>
      </Modal>
    </div>
  )
}
