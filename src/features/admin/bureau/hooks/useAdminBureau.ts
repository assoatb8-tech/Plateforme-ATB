import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  createBureauMember,
  deleteBureauMember,
  updateBureauMember,
  type CreateBureauMemberInput,
  type UpdateBureauMemberInput,
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

// Single shared mutation for the whole list (id passed per-call) rather
// than one hook instance per row — any Bureau member card can be edited
// from the same modal.
export function useUpdateBureauMember() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateBureauMemberInput }) =>
      updateBureauMember(id, input),
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
