import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import { Pencil, Plus, Search, Trash2, UserRound, Users, X } from 'lucide-react'
import { resolveBureauPosition } from '@/utils/displayName'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { SkeletonCards } from '@/components/ui/SkeletonCards'
import { useBureauMembers } from '@/features/bureau/hooks/useBureau'
import type { BureauMemberDto } from '@/features/bureau/types'
import {
  useCreateBureauMember,
  useDeleteBureauMember,
  useUpdateBureauMember,
} from '@/features/admin/bureau/hooks/useAdminBureau'
import {
  bureauMemberFormSchema,
  type BureauMemberFormValues,
} from '@/features/admin/bureau/validation'
import { useAdminUsersList } from '@/features/admin/users/hooks/useAdminUsers'
import type { UserListItemDto } from '@/features/admin/users/types'
import { resolveMemberDisplayName } from '@/utils/displayName'
import { useSignedPhotoUrls } from '@/hooks/useSignedPhotoUrls'
import { clearFormDraft, loadFormDraft, useAutosaveFormDraft } from '@/hooks/useFormDraft'

// A mobile tab reload while an admin is mid-way through adding a Bureau
// member (e.g. backgrounding the app to go copy a Facebook link) shouldn't
// lose their selection or typing — see src/hooks/useFormDraft.ts. The
// selected member is plain component state (not a react-hook-form field),
// so it gets its own small localStorage slot alongside the form draft.
const MEMBER_DRAFT_KEY = 'atb.admin-bureau-create.member'
const FORM_DRAFT_KEY = 'atb.admin-bureau-create.draft'

function loadMemberDraft(): UserListItemDto | null {
  try {
    const raw = localStorage.getItem(MEMBER_DRAFT_KEY)
    return raw ? (JSON.parse(raw) as UserListItemDto) : null
  } catch {
    return null
  }
}

export function AdminBureauListPage() {
  const { t, i18n } = useTranslation()
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [editingMember, setEditingMember] = useState<BureauMemberDto | null>(null)
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)
  const [memberSearchInput, setMemberSearchInput] = useState('')
  const [memberSearch, setMemberSearch] = useState('')
  const [selectedMember, setSelectedMember] = useState<UserListItemDto | null>(loadMemberDraft)
  const [memberError, setMemberError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  useEffect(() => {
    if (selectedMember) {
      localStorage.setItem(MEMBER_DRAFT_KEY, JSON.stringify(selectedMember))
    } else {
      localStorage.removeItem(MEMBER_DRAFT_KEY)
    }
  }, [selectedMember])

  const { data: members, isLoading, isError } = useBureauMembers()
  const createMutation = useCreateBureauMember()
  const updateMutation = useUpdateBureauMember()
  const deleteMutation = useDeleteBureauMember()
  const { data: memberResults, isFetching: isSearchingMembers } = useAdminUsersList(
    1,
    memberSearch,
    '',
  )
  const candidatePhotoUrls = useSignedPhotoUrls(
    memberResults?.users.map((candidate) => candidate.photoUrl) ?? [],
  )

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<BureauMemberFormValues>({
    resolver: zodResolver(bureauMemberFormSchema),
    defaultValues: loadFormDraft<BureauMemberFormValues>(FORM_DRAFT_KEY) ?? undefined,
  })

  useAutosaveFormDraft(FORM_DRAFT_KEY, watch)

  // Editing an existing entry only ever touches position/Facebook link —
  // who it's linked to is fixed (see bureauMemberUpdateSchema) — so this
  // is a separate, simpler form than the create one above (no member
  // picker, no draft persistence: a quick two-field edit isn't worth the
  // same "survive a backgrounded tab" treatment as filling out a full
  // create flow).
  const {
    register: registerEdit,
    handleSubmit: handleEditSubmit,
    reset: resetEdit,
    formState: { errors: editErrors },
  } = useForm<BureauMemberFormValues>({ resolver: zodResolver(bureauMemberFormSchema) })

  function openEditModal(member: BureauMemberDto) {
    setEditingMember(member)
    resetEdit({
      positionFr: member.positionFr ?? '',
      positionAr: member.positionAr ?? '',
      facebookUrl: member.facebookUrl,
    })
  }

  function closeEditModal() {
    setEditingMember(null)
  }

  async function onEditSubmit(values: BureauMemberFormValues) {
    if (!editingMember) return
    setActionError(null)
    try {
      await updateMutation.mutateAsync({ id: editingMember.id, input: values })
      closeEditModal()
    } catch {
      setActionError(t('admin.bureau.actionError'))
    }
  }

  function closeCreateModal() {
    setCreateModalOpen(false)
    setMemberSearchInput('')
    setMemberSearch('')
    setSelectedMember(null)
    setMemberError(null)
    // reset() first (to blank, not back to whatever draft seeded
    // defaultValues) — its own change fires the autosave `watch`
    // subscription, so clearFormDraft must run after or it'd immediately
    // get overwritten with the just-reset (stale) values.
    reset({ positionFr: '', positionAr: '', facebookUrl: '' })
    clearFormDraft(FORM_DRAFT_KEY)
  }

  function runMemberSearch() {
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
        positionFr: values.positionFr,
        positionAr: values.positionAr,
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
                {resolveBureauPosition(member, i18n.language) && (
                  <p className="truncate text-xs font-medium text-primary">
                    {resolveBureauPosition(member, i18n.language)}
                  </p>
                )}
                <p className="truncate text-xs text-slate-500">{member.phone}</p>
                <p className="truncate text-xs text-slate-500">{member.email}</p>
              </div>
              <Button
                type="button"
                variant="ghost"
                aria-label={t('admin.bureau.editAction')}
                onClick={() => openEditModal(member)}
              >
                <Pencil size={16} />
              </Button>
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
                {selectedMember.photoUrl && candidatePhotoUrls[selectedMember.photoUrl] ? (
                  <img
                    src={candidatePhotoUrls[selectedMember.photoUrl]}
                    alt=""
                    className="h-8 w-8 shrink-0 rounded-full object-cover"
                  />
                ) : (
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-300">
                    <UserRound size={16} />
                  </span>
                )}
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
                {/* A <form> here (nested inside the outer create-member
                    form below) is invalid HTML — browsers don't allow
                    nested forms and silently break the boundary between
                    them, which made this "inner form"'s submit fall
                    through to a real native submit of the OUTER form
                    (full page reload, losing everything). Plain div +
                    explicit Enter-key handling instead. */}
                <div className="flex gap-2">
                  <Input
                    type="search"
                    placeholder={t('admin.bureau.create.searchPlaceholder')}
                    value={memberSearchInput}
                    onChange={(event) => setMemberSearchInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault()
                        runMemberSearch()
                      }
                    }}
                    aria-label={t('admin.bureau.create.searchPlaceholder')}
                    className="min-w-0 flex-1"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    className="shrink-0"
                    onClick={runMemberSearch}
                  >
                    <Search size={16} />
                  </Button>
                </div>
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
                      className="flex items-center gap-3 rounded-lg px-3 py-2 text-start hover:bg-slate-50"
                    >
                      {candidate.photoUrl && candidatePhotoUrls[candidate.photoUrl] ? (
                        <img
                          src={candidatePhotoUrls[candidate.photoUrl]}
                          alt=""
                          className="h-8 w-8 shrink-0 rounded-full object-cover"
                        />
                      ) : (
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-300">
                          <UserRound size={16} />
                        </span>
                      )}
                      <span className="flex flex-col items-start">
                        <span className="text-sm font-medium text-slate-800">
                          {resolveMemberDisplayName(candidate, i18n.language) || candidate.email}
                        </span>
                        <span className="text-xs text-slate-500">{candidate.email}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </>
            )}
            {memberError && <p className="text-sm text-error">{memberError}</p>}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              required
              label={t('admin.bureau.create.positionFrLabel')}
              placeholder="Président"
              error={errors.positionFr && t(errors.positionFr.message ?? 'validation.required')}
              {...register('positionFr')}
            />
            <Input
              required
              dir="rtl"
              label={t('admin.bureau.create.positionArLabel')}
              placeholder="رئيس"
              error={errors.positionAr && t(errors.positionAr.message ?? 'validation.required')}
              {...register('positionAr')}
            />
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
        open={editingMember !== null}
        onClose={closeEditModal}
        title={t('admin.bureau.edit.title')}
      >
        <form onSubmit={handleEditSubmit(onEditSubmit)} noValidate className="flex flex-col gap-4">
          {editingMember && (
            <div className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-2.5">
              {editingMember.photoUrl ? (
                <img
                  src={editingMember.photoUrl}
                  alt=""
                  className="h-8 w-8 shrink-0 rounded-full object-cover"
                />
              ) : (
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-300">
                  <UserRound size={16} />
                </span>
              )}
              <p className="truncate text-sm font-medium text-slate-800">
                {resolveMemberDisplayName(editingMember, i18n.language)}
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              required
              label={t('admin.bureau.create.positionFrLabel')}
              placeholder="Président"
              error={
                editErrors.positionFr && t(editErrors.positionFr.message ?? 'validation.required')
              }
              {...registerEdit('positionFr')}
            />
            <Input
              required
              dir="rtl"
              label={t('admin.bureau.create.positionArLabel')}
              placeholder="رئيس"
              error={
                editErrors.positionAr && t(editErrors.positionAr.message ?? 'validation.required')
              }
              {...registerEdit('positionAr')}
            />
          </div>

          <Input
            type="url"
            required
            placeholder="https://facebook.com/..."
            label={t('admin.bureau.create.facebookLabel')}
            error={
              editErrors.facebookUrl && t(editErrors.facebookUrl.message ?? 'validation.required')
            }
            {...registerEdit('facebookUrl')}
          />

          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={closeEditModal}>
              {t('admin.bureau.create.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={updateMutation.isPending}
              loading={updateMutation.isPending}
            >
              {t('admin.bureau.edit.submit')}
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
