import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  banUser,
  deleteUser,
  fetchUser,
  fetchUsers,
  updateUserRole,
  updateUserStatus,
} from '@/features/admin/users/services/usersService'
import type { Role, UserStatus } from '@/types/domain'

export const adminUsersKeys = {
  all: ['admin', 'users'] as const,
  list: (page: number, search: string, status: string) =>
    ['admin', 'users', 'list', page, search, status] as const,
  detail: (id: string) => ['admin', 'users', 'detail', id] as const,
}

export function useAdminUsersList(page: number, search: string, status: string) {
  return useQuery({
    queryKey: adminUsersKeys.list(page, search, status),
    queryFn: () => fetchUsers({ page, search, status: status as UserStatus | '' }),
    placeholderData: keepPreviousData,
  })
}

export function useAdminUser(id: string | undefined) {
  return useQuery({
    queryKey: adminUsersKeys.detail(id ?? ''),
    queryFn: () => fetchUser(id as string),
    enabled: Boolean(id),
  })
}

function useInvalidateUserQueries(id: string) {
  const queryClient = useQueryClient()
  return () => {
    void queryClient.invalidateQueries({ queryKey: adminUsersKeys.detail(id) })
    void queryClient.invalidateQueries({ queryKey: adminUsersKeys.all })
    void queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] })
  }
}

export function useUpdateUserStatus(id: string) {
  const invalidate = useInvalidateUserQueries(id)
  return useMutation({
    mutationFn: (status: UserStatus) => updateUserStatus(id, status),
    onSuccess: invalidate,
  })
}

export function useUpdateUserRole(id: string) {
  const invalidate = useInvalidateUserQueries(id)
  return useMutation({
    mutationFn: (role: Role) => updateUserRole(id, role),
    onSuccess: invalidate,
  })
}

export function useBanUser(id: string) {
  const invalidate = useInvalidateUserQueries(id)
  return useMutation({
    mutationFn: (reason: string) => banUser(id, reason),
    onSuccess: invalidate,
  })
}

export function useDeleteUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteUser(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminUsersKeys.all })
      void queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] })
    },
  })
}
