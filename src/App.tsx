import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { PublicLayout } from '@/layouts/PublicLayout'
import { AuthLayout } from '@/layouts/AuthLayout'
import { HomePage } from '@/pages/HomePage'
import { ComingSoonPage } from '@/pages/ComingSoonPage'
import { LoginPage } from '@/features/auth/pages/LoginPage'
import { RegisterPage } from '@/features/auth/pages/RegisterPage'
import { ForgotPasswordPage } from '@/features/auth/pages/ForgotPasswordPage'
import { ResetPasswordPage } from '@/features/auth/pages/ResetPasswordPage'
import { MemberFormPage } from '@/features/member-form/pages/MemberFormPage'
import { AuthProvider } from '@/features/auth/hooks/AuthProvider'
import { ProtectedRoute } from '@/routes/ProtectedRoute'
import { useDirection } from '@/hooks/useDirection'

const queryClient = new QueryClient()

function AppRoutes() {
  useDirection()

  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route index element={<HomePage />} />
        <Route path="evenements" element={<ComingSoonPage titleKey="nav.events" />} />
        <Route
          path="tableau-de-bord"
          element={
            <ProtectedRoute>
              <ComingSoonPage titleKey="nav.dashboard" />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <ComingSoonPage titleKey="nav.admin" />
            </ProtectedRoute>
          }
        />
        <Route
          path="dossier-adhesion"
          element={
            <ProtectedRoute>
              <MemberFormPage />
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
      </BrowserRouter>
    </QueryClientProvider>
  )
}
