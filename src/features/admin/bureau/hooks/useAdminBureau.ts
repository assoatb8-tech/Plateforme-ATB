import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  createBureauMember,
  deleteBureauMember,
  type CreateBureauMemberInput,
} from '@/features/admin/bureau/services/adminBureauService'
import { bureauKeys } from '@/features/bureau/hooks/useBureau'

// Shares the public bureauKeys.all with the public Bureau page so admin
// create/delete invalidates the same cache it reads — mirrors the sponsors
// feature's useSponsors()/useAdminSponsors() split.
export function useCreateBureauMember() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateBureauMemberInput) => createBureauMember(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: bureauKeys.all })
    },
  })
}

export function useDeleteBureauMember() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteBureauMember(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: bureauKeys.all })
    },
  })
}
