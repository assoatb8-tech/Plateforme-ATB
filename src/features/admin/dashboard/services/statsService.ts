import { apiRequest } from '@/services/apiClient'
import type { AdminStatsDto } from '@/features/admin/dashboard/types'

export async function fetchAdminStats(): Promise<AdminStatsDto> {
  return apiRequest<AdminStatsDto>('/api/admin/stats')
}
