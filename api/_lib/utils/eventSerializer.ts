import type { Event, RegistrationStatus } from '@prisma/client'

// Shared shape returned by GET /api/events and GET /api/events/:id so the
// frontend never has to compute capacity/registration state itself.
export interface EventWithMeta {
  id: string
  titleFr: string
  titleAr: string
  descriptionFr: string
  descriptionAr: string
  location: string
  startDate: Date
  endDate: Date
  maxParticipants: number
  status: string
  facebookPostUrl: string | null
  bannerUrl: string | null
  leaderId: string | null
  createdAt: Date
  registeredCount: number
  spotsLeft: number
  myRegistrationStatus: RegistrationStatus | null
}

export function serializeEvent(
  event: Event & { registeredCount: number },
  myRegistrationStatus: RegistrationStatus | null,
): EventWithMeta {
  return {
    id: event.id,
    titleFr: event.titleFr,
    titleAr: event.titleAr,
    descriptionFr: event.descriptionFr,
    descriptionAr: event.descriptionAr,
    location: event.location,
    startDate: event.startDate,
    endDate: event.endDate,
    maxParticipants: event.maxParticipants,
    status: event.status,
    facebookPostUrl: event.facebookPostUrl,
    bannerUrl: event.bannerUrl,
    leaderId: event.leaderId,
    createdAt: event.createdAt,
    registeredCount: event.registeredCount,
    spotsLeft: Math.max(0, event.maxParticipants - event.registeredCount),
    myRegistrationStatus,
  }
}
