import { useQuery } from '@tanstack/react-query'
import { fetchBureauMembers } from '@/features/bureau/services/bureauService'

export const bureauKeys = {
  all: ['bureau'] as const,
}

export function useBureauMembers() {
  return useQuery({ queryKey: bureauKeys.all, queryFn: fetchBureauMembers })
}
