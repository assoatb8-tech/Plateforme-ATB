import { apiRequest } from '@/services/apiClient'
import type { SponsorDto } from '@/features/sponsors/types'

export async function fetchSponsors(): Promise<SponsorDto[]> {
  return apiRequest<SponsorDto[]>('/api/sponsors', { requireAuth: false })
}
