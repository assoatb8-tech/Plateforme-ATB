import type { UserStatus } from '@/types/domain'
import type { RegistrationStatus } from '@/features/events/types'
import type { EffectiveEventStatus } from '@/utils/eventStatus'
import type { BadgeTone } from '@/components/ui/StatusBadge'

export const USER_STATUS_TONE: Record<UserStatus, BadgeTone> = {
  ACTIVE: 'success',
  PENDING: 'warning',
  BANNED: 'error',
}

export const EVENT_STATUS_TONE: Record<EffectiveEventStatus, BadgeTone> = {
  ACTIVE: 'success',
  CANCELLED: 'error',
  DONE: 'neutral',
}

export const REGISTRATION_STATUS_TONE: Record<RegistrationStatus, BadgeTone> = {
  REGISTERED: 'success',
  WAITING_LIST: 'secondary',
  CANCELLED: 'error',
}
