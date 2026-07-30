import type { UserStatus, PaymentStatus } from '@/types/domain'
import type { EventStatus, RegistrationStatus } from '@/features/events/types'
import type { BadgeTone } from '@/components/ui/StatusBadge'

export const USER_STATUS_TONE: Record<UserStatus, BadgeTone> = {
  ACTIVE: 'success',
  PENDING: 'warning',
  BANNED: 'error',
}

export const EVENT_STATUS_TONE: Record<EventStatus, BadgeTone> = {
  ACTIVE: 'success',
  CANCELLED: 'error',
}

export const PAYMENT_STATUS_TONE: Record<PaymentStatus, BadgeTone> = {
  PENDING: 'warning',
  VALIDATED: 'success',
  REJECTED: 'error',
}

export const REGISTRATION_STATUS_TONE: Record<RegistrationStatus, BadgeTone> = {
  REGISTERED: 'success',
  WAITING_LIST: 'secondary',
  CANCELLED: 'error',
}
