import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import { Plus, Search, Trash2, UserRound, Users, X } from 'lucide-react'
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
import { useAdminUsersList } from '@/features/admin/users/hooks/useAdminUsers'
import type { UserListItemDto } from '@/features/admin/users/types'
import { resolveMemberDisplayName } from '@/utils/displayName'

export function AdminBureauListPage() {
  const { t, i18n } = useTranslation()
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)
  const [memberSearchInput, setMemberSearchInput] = useState('')
  const [memberSearch, setMemberSearch] = useState('')
  const [selectedMember, setSelectedMember] = useState<UserListItemDto | null>(null)
  const [memberError, setMemberError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const { data: members, isLoading, isError } = useBureauMembers()
  const createMutation = useCreateBureauMember()
  const deleteMutation = useDeleteBureauMember()
  const { data: memberResults, isFetching: isSearchingMembers } = useAdminUsersList(
    1,
    memberSearch,
    '',
  )

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BureauMemberFormValues>({ resolver: zodResolver(bureauMemberFormSchema) })

  function closeCreateModal() {
    setCreateModalOpen(false)
    setMemberSearchInput('')
    setMemberSearch('')
    setSelectedMember(null)
    setMemberError(null)
    reset()
  }

  function handleMemberSearchSubmit(event: React.FormEvent) {
    event.preventDefault()
    setMemberSearch(memberSearchInput.trim())
  }

  async function onCreateSubmit(values: BureauMemberFormValues) {
    if (!selectedMember) {
      setMemberError(t('admin.bureau.create.memberRequired'))
      return
    }
    setActionError(null)
    try {
      await createMutation.mutateAsync({
        userId: selectedMember.id,
        facebookUrl: values.facebookUrl,
      })
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
              {member.photoUrl ? (
                <img
                  src={member.photoUrl}
                  alt=""
                  className="h-12 w-12 shrink-0 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-300">
                  <UserRound size={20} />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-800">
                  {resolveMemberDisplayName(member, i18n.language)}
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
              {t('admin.bureau.create.memberLabel')}
              <span className="text-error" aria-hidden="true">
                {' '}
                *
              </span>
            </label>

            {selectedMember ? (
              <div className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-800">
                    {resolveMemberDisplayName(selectedMember, i18n.language) ||
                      selectedMember.email}
                  </p>
                  <p className="truncate text-xs text-slate-500">{selectedMember.email}</p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  aria-label={t('admin.bureau.create.changeSelection')}
                  onClick={() => setSelectedMember(null)}
                >
                  <X size={16} />
                </Button>
              </div>
            ) : (
              <>
                <form onSubmit={handleMemberSearchSubmit} className="flex gap-2">
                  <Input
                    type="search"
                    placeholder={t('admin.bureau.create.searchPlaceholder')}
                    value={memberSearchInput}
                    onChange={(event) => setMemberSearchInput(event.target.value)}
                    aria-label={t('admin.bureau.create.searchPlaceholder')}
                    className="min-w-0 flex-1"
                  />
                  <Button type="submit" variant="secondary" className="shrink-0">
                    <Search size={16} />
                  </Button>
                </form>
                <div className="flex max-h-48 flex-col gap-1 overflow-y-auto">
                  {isSearchingMembers && (
                    <p className="p-2 text-sm text-slate-500">{t('admin.loading')}</p>
                  )}
                  {!isSearchingMembers && memberResults?.users.length === 0 && (
                    <p className="p-2 text-sm text-slate-500">
                      {t('admin.bureau.create.noResults')}
                    </p>
                  )}
                  {memberResults?.users.map((candidate) => (
                    <button
                      key={candidate.id}
                      type="button"
                      onClick={() => setSelectedMember(candidate)}
                      className="flex flex-col items-start rounded-lg px-3 py-2 text-start hover:bg-slate-50"
                    >
                      <span className="text-sm font-medium text-slate-800">
                        {resolveMemberDisplayName(candidate, i18n.language) || candidate.email}
                      </span>
                      <span className="text-xs text-slate-500">{candidate.email}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
            {memberError && <p className="text-sm text-error">{memberError}</p>}
          </div>

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
