import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { PublicLayout } from '@/layouts/PublicLayout'
import { AuthLayout } from '@/layouts/AuthLayout'
import { AdminLayout } from '@/layouts/AdminLayout'
import { AuthProvider } from '@/features/auth/hooks/AuthProvider'
import { ProtectedRoute } from '@/routes/ProtectedRoute'
import { useDirection } from '@/hooks/useDirection'
import { PwaPrompts } from '@/pwa/PwaPrompts'

const HomePage = lazy(() => import('@/pages/HomePage').then((m) => ({ default: m.HomePage })))
const LoginPage = lazy(() =>
  import('@/features/auth/pages/LoginPage').then((m) => ({ default: m.LoginPage })),
)
const RegisterPage = lazy(() =>
  import('@/features/auth/pages/RegisterPage').then((m) => ({ default: m.RegisterPage })),
)
const ForgotPasswordPage = lazy(() =>
  import('@/features/auth/pages/ForgotPasswordPage').then((m) => ({
    default: m.ForgotPasswordPage,
  })),
)
const ResetPasswordPage = lazy(() =>
  import('@/features/auth/pages/ResetPasswordPage').then((m) => ({
    default: m.ResetPasswordPage,
  })),
)
const MemberFormPage = lazy(() =>
  import('@/features/member-form/pages/MemberFormPage').then((m) => ({
    default: m.MemberFormPage,
  })),
)
const EventsListPage = lazy(() =>
  import('@/features/events/pages/EventsListPage').then((m) => ({ default: m.EventsListPage })),
)
const EventDetailPage = lazy(() =>
  import('@/features/events/pages/EventDetailPage').then((m) => ({
    default: m.EventDetailPage,
  })),
)
const DashboardPage = lazy(() =>
  import('@/features/dashboard/pages/DashboardPage').then((m) => ({ default: m.DashboardPage })),
)
const ProfilePage = lazy(() =>
  import('@/features/profile/pages/ProfilePage').then((m) => ({ default: m.ProfilePage })),
)
const ParticipationsPage = lazy(() =>
  import('@/features/participations/pages/ParticipationsPage').then((m) => ({
    default: m.ParticipationsPage,
  })),
)
const AdminDashboardPage = lazy(() =>
  import('@/features/admin/dashboard/pages/AdminDashboardPage').then((m) => ({
    default: m.AdminDashboardPage,
  })),
)
const AdminUsersListPage = lazy(() =>
  import('@/features/admin/users/pages/AdminUsersListPage').then((m) => ({
    default: m.AdminUsersListPage,
  })),
)
const AdminUserDetailPage = lazy(() =>
  import('@/features/admin/users/pages/AdminUserDetailPage').then((m) => ({
    default: m.AdminUserDetailPage,
  })),
)
const AdminEventsListPage = lazy(() =>
  import('@/features/admin/events/pages/AdminEventsListPage').then((m) => ({
    default: m.AdminEventsListPage,
  })),
)
const AdminEventFormPage = lazy(() =>
  import('@/features/admin/events/pages/AdminEventFormPage').then((m) => ({
    default: m.AdminEventFormPage,
  })),
)
const AdminPaymentsListPage = lazy(() =>
  import('@/features/admin/payments/pages/AdminPaymentsListPage').then((m) => ({
    default: m.AdminPaymentsListPage,
  })),
)

function RouteLoader() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <Loader2 size={28} className="animate-spin text-primary" />
    </div>
  )
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

function AppRoutes() {
  useDirection()

  return (
    <Suspense fallback={<RouteLoader />}>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route index element={<HomePage />} />
          <Route path="evenements" element={<EventsListPage />} />
          <Route path="evenements/:id" element={<EventDetailPage />} />
          <Route
            path="tableau-de-bord"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="admin"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminDashboardPage />} />
            <Route path="membres" element={<AdminUsersListPage />} />
            <Route path="membres/:id" element={<AdminUserDetailPage />} />
            <Route path="evenements" element={<AdminEventsListPage />} />
            <Route path="evenements/nouveau" element={<AdminEventFormPage />} />
            <Route path="evenements/:id/modifier" element={<AdminEventFormPage />} />
            <Route path="cotisations" element={<AdminPaymentsListPage />} />
          </Route>
          <Route
            path="dossier-adhesion"
            element={
              <ProtectedRoute>
                <MemberFormPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="mon-profil"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="mes-participations"
            element={
              <ProtectedRoute>
                <ParticipationsPage />
              </ProtectedRoute>
            }
          />
        </Route>

        <Route element={<AuthLayout />}>
          <Route path="connexion" element={<LoginPage />} />
          <Route path="inscription" element={<RegisterPage />} />
          <Route path="mot-de-passe-oublie" element={<ForgotPasswordPage />} />
          <Route path="reinitialiser-mot-de-passe" element={<ResetPasswordPage />} />
        </Route>
      </Routes>
    </Suspense>
  )
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
        <PwaPrompts />
      </BrowserRouter>
    </QueryClientProvider>
  )
}
