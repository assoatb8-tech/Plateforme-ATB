export type RegistrationStatus = 'REGISTERED' | 'CANCELLED' | 'WAITING_LIST'
export type EventStatus = 'ACTIVE' | 'CANCELLED'
export type EventTense = 'upcoming' | 'past'

export interface EventDto {
  id: string
  titleFr: string
  titleAr: string
  descriptionFr: string
  descriptionAr: string
  location: string
  startDate: string
  endDate: string
  maxParticipants: number
  status: EventStatus
  facebookPostUrl: string | null
  bannerUrl: string | null
  leaderId: string | null
  createdAt: string
  registeredCount: number
  spotsLeft: number
  myRegistrationStatus: RegistrationStatus | null
}

export interface EventsListResponse {
  events: EventDto[]
  page: number
  pageSize: number
  total: number
  totalPages: number
}

// Nested `event` on a registration row (api/registrations.ts) is the raw
// Prisma Event, not the list/detail endpoints' derived EventDto — it has no
// registeredCount/spotsLeft/myRegistrationStatus.
export interface EventSummaryDto {
  id: string
  titleFr: string
  titleAr: string
  descriptionFr: string
  descriptionAr: string
  location: string
  startDate: string
  endDate: string
  maxParticipants: number
  status: EventStatus
  createdAt: string
}

export interface RegistrationDto {
  id: string
  eventId: string
  userId: string
  status: RegistrationStatus
  registeredAt: string
  event: EventSummaryDto
}
