import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CalendarX, Search } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { EventCard } from '@/features/events/components/EventCard'
import { useEventsList } from '@/features/events/hooks/useEvents'

export function EventsListPage() {
  const { t } = useTranslation()
  const [page, setPage] = useState(1)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')

  const { data, isLoading, isError } = useEventsList(page, search)

  function handleSearchSubmit(event: React.FormEvent) {
    event.preventDefault()
    setPage(1)
    setSearch(searchInput.trim())
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-8 flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-slate-900">{t('events.title')}</h1>
        <p className="text-sm text-slate-500">{t('events.subtitle')}</p>
      </div>

      <form onSubmit={handleSearchSubmit} className="mb-8 flex max-w-md gap-2">
        <Input
          type="search"
          className="min-w-0 flex-1"
          placeholder={t('events.searchPlaceholder')}
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          aria-label={t('events.searchPlaceholder')}
        />
        <Button type="submit" variant="secondary" className="shrink-0">
          <Search size={16} />
          {t('events.search')}
        </Button>
      </form>

      {isLoading && <Spinner label={t('events.loading')} />}

      {isError && <p className="text-sm text-error">{t('events.errorGeneric')}</p>}

      {!isLoading && !isError && data && data.events.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-slate-200 py-20 text-center">
          <CalendarX size={40} className="text-slate-300" />
          <p className="text-sm text-slate-500">
            {search ? t('events.noResults') : t('events.noEventsYet')}
          </p>
        </div>
      )}

      {!isLoading && data && data.events.length > 0 && (
        <>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {data.events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>

          {data.totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-4">
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
