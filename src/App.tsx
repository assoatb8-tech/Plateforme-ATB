import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { PublicLayout } from '@/layouts/PublicLayout'
import { HomePage } from '@/pages/HomePage'
import { ComingSoonPage } from '@/pages/ComingSoonPage'
import { useDirection } from '@/hooks/useDirection'

const queryClient = new QueryClient()

function AppRoutes() {
  useDirection()

  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route index element={<HomePage />} />
        <Route path="connexion" element={<ComingSoonPage titleKey="nav.login" />} />
        <Route path="inscription" element={<ComingSoonPage titleKey="nav.register" />} />
        <Route path="evenements" element={<ComingSoonPage titleKey="nav.events" />} />
      </Route>
    </Routes>
  )
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </QueryClientProvider>
  )
}
