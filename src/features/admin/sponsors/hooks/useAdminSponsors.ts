import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  createSponsor,
  deleteSponsor,
} from '@/features/admin/sponsors/services/adminSponsorsService'
import { sponsorsKeys } from '@/features/sponsors/hooks/useSponsors'

function useInvalidateSponsorsQueries() {
  const queryClient = useQueryClient()
  return () => void queryClient.invalidateQueries({ queryKey: sponsorsKeys.all })
}

export function useCreateSponsor() {
  const invalidate = useInvalidateSponsorsQueries()
  return useMutation({
    mutationFn: (input: { name: string; logoUrl: string }) => createSponsor(input),
    onSuccess: invalidate,
  })
}

export function useDeleteSponsor() {
  const invalidate = useInvalidateSponsorsQueries()
  return useMutation({
    mutationFn: (id: string) => deleteSponsor(id),
    onSuccess: invalidate,
  })
}
