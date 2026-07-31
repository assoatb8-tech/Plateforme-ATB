import { useQuery } from '@tanstack/react-query'
import { fetchSponsors } from '@/features/sponsors/services/sponsorsService'

export const sponsorsKeys = {
  all: ['sponsors'] as const,
}

export function useSponsors() {
  return useQuery({ queryKey: sponsorsKeys.all, queryFn: fetchSponsors })
}
