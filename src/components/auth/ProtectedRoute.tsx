import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useCurrentLang } from '@/hooks/useCurrentLang'
import { useAuth } from '@/hooks/useAuth'
import { buildLocalizedPath } from '@/lib/localizedPath'

function ProtectedRoute() {
  const { session, isLoading } = useAuth()
  const lang = useCurrentLang()
  const location = useLocation()

  if (isLoading) return null

  if (!session) {
    const redirectTo = `${buildLocalizedPath(lang, '/prijava')}?redirect=${encodeURIComponent(location.pathname)}`
    return <Navigate to={redirectTo} replace />
  }

  return <Outlet />
}

export default ProtectedRoute
