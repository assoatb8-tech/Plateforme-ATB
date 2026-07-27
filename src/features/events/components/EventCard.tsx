import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Calendar, MapPin, Users } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import type { EventDto } from '@/features/events/types'

interface EventCardProps {
  event: EventDto
}

export function EventCard({ event }: EventCardProps) {
  const { t, i18n } = useTranslation()
  const title = i18n.language === 'ar' ? event.titleAr : event.titleFr
  const description = i18n.language === 'ar' ? event.descriptionAr : event.descriptionFr

  const startDate = new Date(event.startDate).toLocaleDateString(
    i18n.language === 'ar' ? 'ar-TN' : 'fr-TN',
    { day: 'numeric', month: 'long', year: 'numeric' },
  )

  const isFull = event.spotsLeft <= 0

  return (
    <Link to={`/evenements/${event.id}`} className="block h-full">
      <Card className="flex h-full flex-col gap-3 transition-shadow hover:shadow-md">
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        <p className="line-clamp-2 flex-1 text-sm text-slate-600">{description}</p>

        <div className="flex flex-col gap-1.5 text-sm text-slate-500">
          <span className="flex items-center gap-2">
            <Calendar size={16} className="shrink-0" />
            {startDate}
          </span>
          <span className="flex items-center gap-2">
            <MapPin size={16} className="shrink-0" />
            {event.location}
          </span>
          <span className="flex items-center gap-2">
            <Users size={16} className="shrink-0" />
            {isFull ? t('events.full') : t('events.spotsLeft', { count: event.spotsLeft })}
          </span>
        </div>

        {event.myRegistrationStatus === 'REGISTERED' && (
          <span className="w-fit rounded-full bg-success/10 px-3 py-1 text-xs font-medium text-success">
            {t('events.status.registered')}
          </span>
        )}
        {event.myRegistrationStatus === 'WAITING_LIST' && (
          <span className="w-fit rounded-full bg-secondary/10 px-3 py-1 text-xs font-medium text-secondary">
            {t('events.status.waitingList')}
          </span>
        )}
      </Card>
    </Link>
  )
}
