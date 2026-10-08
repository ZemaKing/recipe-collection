import { ShieldX } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import EmptyState from '@/components/ui/EmptyState'
import { useCurrentLang } from '@/hooks/useCurrentLang'
import { useAuth } from '@/hooks/useAuth'
import { buildLocalizedPath } from '@/lib/localizedPath'

function ProtectedRoute() {
  const { t } = useTranslation()
  const { session, isAdmin, isLoading, signOut } = useAuth()
  const lang = useCurrentLang()
  const location = useLocation()

  if (isLoading) return null

  if (!session) {
    const redirectTo = `${buildLocalizedPath(lang, '/prijava')}?redirect=${encodeURIComponent(location.pathname)}`
    return <Navigate to={redirectTo} replace />
  }

  // Signed in but not in admin_users: the database would refuse every write
  // anyway, so don't show an admin UI that can't save anything.
  if (!isAdmin) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-4 p-6">
        <EmptyState
          icon={ShieldX}
          title={t('login.notAdmin.title')}
          description={t('login.notAdmin.description', { email: session.user.email })}
        />
        <button
          type="button"
          onClick={() => void signOut()}
          className="rounded-pill border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          {t('login.signOut')}
        </button>
      </div>
    )
  }

  return <Outlet />
}

export default ProtectedRoute
