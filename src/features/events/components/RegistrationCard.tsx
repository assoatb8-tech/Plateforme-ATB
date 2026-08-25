import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Calendar, MapPin } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { StatusBadge } from '@/components/ui/StatusBadge'
import type { RegistrationDto } from '@/features/events/types'
import { REGISTRATION_STATUS_TONE } from '@/utils/statusTones'
import { TUNIS_TIMEZONE } from '@/utils/eventDays'

interface RegistrationCardProps {
  registration: RegistrationDto
}

// Renders a registration's event summary (title/date/location/status).
// Deliberately distinct from EventCard: the nested `event` on a
// registration (api/registrations.ts) carries no registeredCount/spotsLeft,
// so showing a capacity indicator here would mean fabricating numbers —
// accurate capacity is only available from GET /api/events/:id, which the
// detail page (linked to below) fetches.
export function RegistrationCard({ registration }: RegistrationCardProps) {
  const { t, i18n } = useTranslation()
  const { event } = registration
  const title = i18n.language === 'ar' ? event.titleAr : event.titleFr
  const startDate = new Date(event.startDate).toLocaleDateString(
    i18n.language === 'ar' ? 'ar-TN' : 'fr-TN',
    { day: 'numeric', month: 'long', year: 'numeric', timeZone: TUNIS_TIMEZONE },
  )

  return (
    <Link to={`/evenements/${event.id}`} className="block h-full">
      <Card className="flex h-full flex-col gap-3 transition-shadow hover:shadow-md">
        <h3 className="text-base font-semibold text-slate-900">{title}</h3>

        <div className="flex flex-col gap-1.5 text-sm text-slate-500">
          <span className="flex items-center gap-2">
            <Calendar size={16} className="shrink-0" />
            {startDate}
          </span>
          <span className="flex items-center gap-2">
            <MapPin size={16} className="shrink-0" />
            {event.location}
          </span>
        </div>

        <StatusBadge tone={REGISTRATION_STATUS_TONE[registration.status]}>
          {registration.status === 'REGISTERED'
            ? t('events.status.registered')
            : t('events.status.waitingList')}
        </StatusBadge>
      </Card>
    </Link>
  )
}
