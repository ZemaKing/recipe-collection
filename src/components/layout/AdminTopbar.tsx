import { ChefHat, LogOut, User } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useCurrentLang } from '@/hooks/useCurrentLang'
import { buildLocalizedPath } from '@/lib/localizedPath'
import LanguageSwitcher from './LanguageSwitcher'

function AdminTopbar() {
  const { t } = useTranslation()
  const { session, signOut } = useAuth()
  const lang = useCurrentLang()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate(buildLocalizedPath(lang, '/'))
  }

  return (
    <header className="flex items-center gap-4 border-b border-border bg-surface px-4 py-3 md:px-6">
      <div className="flex items-center gap-2 md:hidden">
        <ChefHat className="size-6 shrink-0 text-accent" />
        <span className="text-base font-semibold">{t('admin.shellName')}</span>
      </div>

      <h1 className="hidden text-lg font-semibold md:block">{t('admin.shellName')}</h1>

      <div className="ml-auto flex items-center gap-3">
        <LanguageSwitcher />

        {session?.user.email && (
          <span className="hidden items-center gap-1.5 text-sm text-muted-foreground sm:flex">
            <User className="size-4" />
            {session.user.email}
          </span>
        )}

        <button
          type="button"
          onClick={() => void handleSignOut()}
          title={t('login.signOut')}
          className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:text-foreground"
        >
          <LogOut className="size-4" />
        </button>
      </div>
    </header>
  )
}

export default AdminTopbar
