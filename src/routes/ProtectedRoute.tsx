import { useEffect, type ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/features/auth/hooks/useAuth'
import type { Role } from '@/types/domain'

interface ProtectedRouteProps {
  children: ReactNode
  allowedRoles?: Role[]
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { session, user, loading, signOut } = useAuth()
  const location = useLocation()

  // The API rejects a banned account's requests regardless of this check —
  // this only prevents a locally-cached session (still valid until its own
  // expiry) from rendering the app shell for a user who's already been
  // banned since that token was issued.
  useEffect(() => {
    if (user?.status === 'BANNED') {
      void signOut()
    }
  }, [user, signOut])

  if (loading) return null

  if (!session || !user || user.status === 'BANNED') {
    return <Navigate to="/connexion" state={{ from: location }} replace />
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
