import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { PublicLayout } from '@/layouts/PublicLayout'
import { AuthLayout } from '@/layouts/AuthLayout'
import { AdminLayout } from '@/layouts/AdminLayout'
import { HomePage } from '@/pages/HomePage'
import { LoginPage } from '@/features/auth/pages/LoginPage'
import { RegisterPage } from '@/features/auth/pages/RegisterPage'
import { ForgotPasswordPage } from '@/features/auth/pages/ForgotPasswordPage'
import { ResetPasswordPage } from '@/features/auth/pages/ResetPasswordPage'
import { MemberFormPage } from '@/features/member-form/pages/MemberFormPage'
import { EventsListPage } from '@/features/events/pages/EventsListPage'
import { EventDetailPage } from '@/features/events/pages/EventDetailPage'
import { DashboardPage } from '@/features/dashboard/pages/DashboardPage'
import { ProfilePage } from '@/features/profile/pages/ProfilePage'
import { ParticipationsPage } from '@/features/participations/pages/ParticipationsPage'
import { AdminDashboardPage } from '@/features/admin/dashboard/pages/AdminDashboardPage'
import { AdminUsersListPage } from '@/features/admin/users/pages/AdminUsersListPage'
import { AdminUserDetailPage } from '@/features/admin/users/pages/AdminUserDetailPage'
import { AdminEventsListPage } from '@/features/admin/events/pages/AdminEventsListPage'
import { AdminEventFormPage } from '@/features/admin/events/pages/AdminEventFormPage'
import { AdminPaymentsListPage } from '@/features/admin/payments/pages/AdminPaymentsListPage'
import { AuthProvider } from '@/features/auth/hooks/AuthProvider'
import { ProtectedRoute } from '@/routes/ProtectedRoute'
import { useDirection } from '@/hooks/useDirection'
import { PwaPrompts } from '@/pwa/PwaPrompts'

const queryClient = new QueryClient()

function AppRoutes() {
  useDirection()

  return (
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
