export type RegistrationStatus = 'REGISTERED' | 'CANCELLED' | 'WAITING_LIST'
export type EventStatus = 'ACTIVE' | 'CANCELLED'
export type EventTense = 'upcoming' | 'past'
export type AttendanceStatus = 'PRESENT' | 'ABSENT'

// 'default' means "don't send a sort param" — the server falls back to its
// own per-context default (soonest-first for upcoming, most-recent-first
// for past). title_asc/title_desc alphabetize by whichever language column
// matches the viewer's current UI language (see api/events.ts).
export type EventSort = 'default' | 'title_asc' | 'title_desc' | 'date_asc' | 'date_desc'

// Client-side only — the participants endpoint returns its full,
// unpaginated list in one call, so sorting it is a pure presentation
// concern with no server round-trip.
export type ParticipantSort = 'name_asc' | 'name_desc' | 'joined_asc' | 'joined_desc'

export interface EventDayDto {
  id: string
  startAt: string
  endAt: string
}

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
  isMultiDay: boolean
  days: EventDayDto[]
  // Which of `days` the current user picked for their own registration —
  // empty when not registered, or when the event isn't multi-day.
  myRegistrationDayIds: string[]
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

// Returned by GET /api/events/:id?action=participants — available to an
// ADMIN or to the event's own leader ("chef de groupe"), never any other
// member (see api/events/[id].ts's canManageEvent).
export interface EventParticipantDto {
  id: string
  status: RegistrationStatus
  registeredAt: string
  attendanceStatus: AttendanceStatus | null
  daySelections: { eventDay: EventDayDto }[]
  user: {
    id: string
    email: string
    memberProfile: {
      firstNameFr: string
      lastNameFr: string
      firstNameAr: string
      lastNameAr: string
      phoneMobile: string
      photoUrl: string | null
    } | null
  }
}
