import type { Role, UserStatus } from '@/types/domain'
import type { RegistrationStatus } from '@/features/events/types'

export interface UserListItemDto {
  id: string
  email: string
  role: Role
  status: UserStatus
  createdAt: string
  firstNameFr: string | null
  lastNameFr: string | null
  firstNameAr: string | null
  lastNameAr: string | null
  phoneMobile: string | null
  photoUrl: string | null
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
  firstNameFr: string
  lastNameFr: string
  firstNameAr: string
  lastNameAr: string
  photoUrl: string | null
  phoneMobile: string
  contactEmail: string | null
  cinNumber: string | null
  address: string
  profession: string | null
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
  isProtected: boolean
  createdAt: string
  updatedAt: string
  memberProfile: UserDetailMemberProfileDto | null
  eventRegistrations: UserDetailRegistrationDto[]
  bans: UserDetailBanDto[]
}
