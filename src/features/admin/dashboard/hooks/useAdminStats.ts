import { useQuery } from '@tanstack/react-query'
import { fetchAdminStats } from '@/features/admin/dashboard/services/statsService'

export function useAdminStats() {
  return useQuery({ queryKey: ['admin', 'stats'], queryFn: fetchAdminStats })
}
