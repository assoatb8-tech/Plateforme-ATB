import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Search, UserRound, UserX } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { SkeletonRows } from '@/components/ui/SkeletonRows'
import { useAdminUsersList } from '@/features/admin/users/hooks/useAdminUsers'
import { USER_STATUS_TONE } from '@/utils/statusTones'
import { resolveMemberDisplayName } from '@/utils/displayName'
import { useSignedPhotoUrls } from '@/hooks/useSignedPhotoUrls'

export function AdminUsersListPage() {
  const { t, i18n } = useTranslation()
  const [page, setPage] = useState(1)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')

  const { data, isLoading, isError } = useAdminUsersList(page, search, status)
  const photoUrls = useSignedPhotoUrls(data?.users.map((user) => user.photoUrl) ?? [])

  function handleSearchSubmit(event: React.FormEvent) {
    event.preventDefault()
    setPage(1)
    setSearch(searchInput.trim())
  }

  function handleStatusChange(value: string) {
    setStatus(value)
    setPage(1)
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">{t('admin.users.title')}</h1>
        <p className="text-sm text-slate-500">{t('admin.users.subtitle')}</p>
      </div>

      <form onSubmit={handleSearchSubmit} className="flex flex-col gap-3 sm:flex-row">
        <Input
          type="search"
          placeholder={t('admin.users.searchPlaceholder')}
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          aria-label={t('admin.users.searchPlaceholder')}
          className="sm:max-w-xs"
        />
        <Select
          aria-label={t('admin.users.statusFilterLabel')}
          value={status}
          onChange={(event) => handleStatusChange(event.target.value)}
          placeholder={t('admin.users.statusFilterAll')}
          className="sm:max-w-[200px]"
          options={[
            { value: 'ACTIVE', label: t('dashboard.status.ACTIVE') },
            { value: 'PENDING', label: t('dashboard.status.PENDING') },
            { value: 'BANNED', label: t('dashboard.status.BANNED') },
          ]}
        />
        <Button type="submit" variant="secondary">
          <Search size={16} />
          {t('admin.users.search')}
        </Button>
      </form>

      {isLoading && (
        <Card className="p-4">
          <SkeletonRows count={5} />
        </Card>
      )}
      {isError && <p className="text-sm text-error">{t('admin.errorGeneric')}</p>}

      {!isLoading && !isError && data && data.users.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-slate-200 py-20 text-center">
          <UserX size={40} className="text-slate-300" />
          <p className="text-sm text-slate-500">
            {search || status ? t('admin.users.noResults') : t('admin.users.noUsersYet')}
          </p>
        </div>
      )}

      {!isLoading && data && data.users.length > 0 && (
        <>
          <Card className="overflow-x-auto p-0">
            <table className="w-full min-w-[560px] text-start text-sm">
              <thead className="border-b border-slate-200 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">{t('admin.users.columns.name')}</th>
                  <th className="px-4 py-3">{t('admin.users.columns.email')}</th>
                  <th className="px-4 py-3">{t('admin.users.columns.status')}</th>
                  <th className="px-4 py-3">{t('admin.users.columns.joined')}</th>
                </tr>
              </thead>
              <tbody>
                {data.users.map((user) => (
                  <tr key={user.id} className="border-b border-slate-100 last:border-0">
                    <td className="px-4 py-3">
                      <Link
                        to={`/admin/membres/${user.id}`}
                        className="flex items-center gap-3 font-medium text-primary hover:underline"
                      >
                        {user.photoUrl && photoUrls[user.photoUrl] ? (
                          <img
                            src={photoUrls[user.photoUrl]}
                            alt=""
                            className="h-8 w-8 shrink-0 rounded-full object-cover"
                          />
                        ) : (
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-300">
                            <UserRound size={16} />
                          </span>
                        )}
                        {resolveMemberDisplayName(user, i18n.language) || t('admin.users.noName')}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{user.email}</td>
                    <td className="px-4 py-3">
                      <StatusBadge tone={USER_STATUS_TONE[user.status]}>
                        {t(`dashboard.status.${user.status}`)}
                      </StatusBadge>
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {new Date(user.createdAt).toLocaleDateString()}
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
    </div>
  )
}
