export type NotificationType = 'NEW_EVENT' | 'NEW_MEMBER'

export interface NotificationDto {
  id: string
  type: NotificationType
  readAt: string | null
  createdAt: string
  event: { id: string; titleFr: string; titleAr: string } | null
  relatedUser: {
    id: string
    firstNameFr: string | null
    lastNameFr: string | null
    firstNameAr: string | null
    lastNameAr: string | null
  } | null
}

export interface NotificationsResponse {
  notifications: NotificationDto[]
  unreadCount: number
}
