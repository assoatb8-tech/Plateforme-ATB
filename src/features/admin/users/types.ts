import type { PaymentStatus, PaymentType, Role, UserStatus } from '@/types/domain'
import type { RegistrationStatus } from '@/features/events/types'

export interface UserListItemDto {
  id: string
  email: string
  role: Role
  status: UserStatus
  createdAt: string
  fullName: string | null
  phoneMobile: string | null
}

export interface UsersListResponse {
  users: UserListItemDto[]
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export interface UserSummaryDto {
  id: string
  email: string
  role: Role
  status: UserStatus
  createdAt: string
  updatedAt: string
}

// Subset of MemberProfile fields shown on the admin detail page — the raw
// API response includes every column (api/users/[id].ts does `memberProfile:
// true`), this type only declares what the page actually renders.
export interface UserDetailMemberProfileDto {
  fullName: string
  phoneMobile: string
  contactEmail: string | null
  cinNumber: string | null
  address: string
  profession: string | null
}

export interface UserDetailPaymentDto {
  id: string
  amount: string
  paymentType: PaymentType
  status: PaymentStatus
  createdAt: string
  validatedAt: string | null
}

export interface UserDetailRegistrationDto {
  id: string
  status: RegistrationStatus
  registeredAt: string
  event: { id: string; titleFr: string; titleAr: string; startDate: string }
}

export interface UserDetailBanDto {
  id: string
  reason: string
  createdAt: string
}

export interface UserDetailDto {
  id: string
  email: string
  role: Role
  status: UserStatus
  createdAt: string
  updatedAt: string
  memberProfile: UserDetailMemberProfileDto | null
  payments: UserDetailPaymentDto[]
  eventRegistrations: UserDetailRegistrationDto[]
  bans: UserDetailBanDto[]
}
