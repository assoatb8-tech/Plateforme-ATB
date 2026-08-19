import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Calendar, Facebook, MapPin, Users } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { StatusBadge } from '@/components/ui/StatusBadge'
import type { EventDto } from '@/features/events/types'
import { REGISTRATION_STATUS_TONE } from '@/utils/statusTones'

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
        {event.bannerUrl && (
          <img
            src={event.bannerUrl}
            alt=""
            className="-mx-6 -mt-6 h-36 rounded-t-xl object-cover"
          />
        )}
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          {event.facebookPostUrl && (
            <span
              className="shrink-0 rounded-full bg-[#1877F2]/10 p-1.5 text-[#1877F2]"
              aria-label={t('events.viewOnFacebook')}
              title={t('events.viewOnFacebook')}
            >
              <Facebook size={14} />
            </span>
          )}
        </div>
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

        {(event.myRegistrationStatus === 'REGISTERED' ||
          event.myRegistrationStatus === 'WAITING_LIST') && (
          <StatusBadge tone={REGISTRATION_STATUS_TONE[event.myRegistrationStatus]}>
            {event.myRegistrationStatus === 'REGISTERED'
              ? t('events.status.registered')
              : t('events.status.waitingList')}
          </StatusBadge>
        )}
      </Card>
    </Link>
  )
}
