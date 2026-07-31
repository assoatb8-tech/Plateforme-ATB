import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { CalendarX, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Spinner } from '@/components/ui/Spinner'
import { useAdminEventsList, useDeleteEvent } from '@/features/admin/events/hooks/useAdminEvents'
import { EVENT_STATUS_TONE } from '@/utils/statusTones'

export function AdminEventsListPage() {
  const { t } = useTranslation()
  const [page, setPage] = useState(1)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const { data, isLoading, isError } = useAdminEventsList(page, search)
  const deleteMutation = useDeleteEvent()

  function handleSearchSubmit(event: React.FormEvent) {
    event.preventDefault()
    setPage(1)
    setSearch(searchInput.trim())
  }

  async function handleDeleteConfirm() {
    if (!pendingDeleteId) return
    setActionError(null)
    try {
      await deleteMutation.mutateAsync(pendingDeleteId)
      setPendingDeleteId(null)
    } catch {
      setActionError(t('admin.events.actionError'))
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">{t('admin.events.title')}</h1>
          <p className="text-sm text-slate-500">{t('admin.events.subtitle')}</p>
        </div>
        <Link to="/admin/evenements/nouveau">
          <Button type="button">
            <Plus size={16} />
            {t('admin.events.create')}
          </Button>
        </Link>
      </div>

      <form onSubmit={handleSearchSubmit} className="flex max-w-md gap-2">
        <div className="min-w-0 flex-1">
          <Input
            type="search"
            placeholder={t('events.searchPlaceholder')}
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            aria-label={t('events.searchPlaceholder')}
          />
        </div>
        <Button type="submit" variant="secondary" className="shrink-0">
          <Search size={16} />
          {t('events.search')}
        </Button>
      </form>

      {actionError && <p className="text-sm text-error">{actionError}</p>}

      {isLoading && <Spinner label={t('admin.loading')} />}
      {isError && <p className="text-sm text-error">{t('admin.errorGeneric')}</p>}

      {!isLoading && !isError && data && data.events.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-slate-200 py-20 text-center">
          <CalendarX size={40} className="text-slate-300" />
          <p className="text-sm text-slate-500">
            {search ? t('events.noResults') : t('admin.events.noEventsYet')}
          </p>
        </div>
      )}

      {!isLoading && data && data.events.length > 0 && (
        <>
          <Card className="overflow-x-auto p-0">
            <table className="w-full min-w-[640px] text-start text-sm">
              <thead className="border-b border-slate-200 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">{t('admin.events.columns.title')}</th>
                  <th className="px-4 py-3">{t('admin.events.columns.date')}</th>
                  <th className="px-4 py-3">{t('admin.events.columns.capacity')}</th>
                  <th className="px-4 py-3">{t('admin.events.columns.status')}</th>
                  <th className="px-4 py-3 text-end">{t('admin.events.columns.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {data.events.map((event) => (
                  <tr key={event.id} className="border-b border-slate-100 last:border-0">
                    <td className="px-4 py-3 font-medium text-slate-800">{event.titleFr}</td>
                    <td className="px-4 py-3 text-slate-500">
                      {new Date(event.startDate).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {event.registeredCount} / {event.maxParticipants}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge tone={EVENT_STATUS_TONE[event.status]}>
                        {t(`admin.events.status.${event.status}`)}
                      </StatusBadge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Link to={`/admin/evenements/${event.id}/modifier`}>
                          <Button type="button" variant="ghost" aria-label={t('admin.events.edit')}>
                            <Pencil size={16} />
                          </Button>
                        </Link>
                        <Button
                          type="button"
                          variant="ghost"
                          aria-label={t('admin.events.delete')}
                          onClick={() => setPendingDeleteId(event.id)}
                        >
                          <Trash2 size={16} className="text-error" />
                        </Button>
                      </div>
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
        open={pendingDeleteId !== null}
        onClose={() => setPendingDeleteId(null)}
        title={t('admin.events.deleteConfirmTitle')}
      >
        <p className="text-sm text-slate-600">{t('admin.events.deleteConfirmText')}</p>
        <div className="mt-4 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={() => setPendingDeleteId(null)}>
            {t('admin.events.deleteCancel')}
          </Button>
          <Button
            type="button"
            variant="danger"
            disabled={deleteMutation.isPending}
            loading={deleteMutation.isPending}
            onClick={() => void handleDeleteConfirm()}
          >
            {t('admin.events.deleteConfirm')}
          </Button>
        </div>
      </Modal>
    </div>
  )
}
