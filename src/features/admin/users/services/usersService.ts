import { apiRequest } from '@/services/apiClient'
import type { UserDetailDto, UserSummaryDto, UsersListResponse } from '@/features/admin/users/types'
import type { UserStatus } from '@/types/domain'

export async function fetchUsers(params: {
  page?: number
  search?: string
  status?: UserStatus | ''
}): Promise<UsersListResponse> {
  return apiRequest<UsersListResponse>('/api/users', {
    query: { page: params.page, search: params.search, status: params.status || undefined },
  })
}

export async function fetchUser(id: string): Promise<UserDetailDto> {
  return apiRequest<UserDetailDto>(`/api/users/${id}`)
}

export async function updateUserStatus(id: string, status: UserStatus): Promise<UserSummaryDto> {
  return apiRequest<UserSummaryDto>(`/api/users/${id}/status`, {
    method: 'PATCH',
    body: { status },
  })
}

export async function banUser(id: string, reason: string): Promise<void> {
  await apiRequest(`/api/users/${id}/ban`, { method: 'POST', body: { reason } })
}

export async function deleteUser(id: string): Promise<void> {
  await apiRequest(`/api/users/${id}`, { method: 'DELETE' })
}
