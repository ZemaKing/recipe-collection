import { ArrowLeft, ChefHat } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { NavLink } from 'react-router-dom'
import { useCurrentLang } from '@/hooks/useCurrentLang'
import { buildLocalizedPath } from '@/lib/localizedPath'
import NavRow from './NavRow'
import { adminNavItems } from './nav-items'

function AdminSidebar() {
  const { t } = useTranslation()
  const lang = useCurrentLang()

  return (
    <aside className="hidden shrink-0 flex-col border-r border-border bg-surface md:flex md:w-20 lg:w-64">
      <div className="flex items-center gap-2 px-4 py-5 lg:px-6">
        <ChefHat className="size-7 shrink-0 text-accent" />
        <span className="hidden text-lg font-semibold lg:inline">{t('admin.shellName')}</span>
      </div>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3">
        {adminNavItems.map((item) => (
          <NavRow key={item.path} {...item} />
        ))}
      </nav>

      <div className="border-t border-border p-3">
        <NavLink
          to={buildLocalizedPath(lang, '/')}
          className="flex items-center justify-center gap-2 rounded-control px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-surface-hover hover:text-foreground md:justify-center lg:justify-start"
          title={t('admin.backToSite')}
        >
          <ArrowLeft className="size-4 shrink-0" />
          <span className="hidden lg:inline">{t('admin.backToSite')}</span>
        </NavLink>
      </div>
    </aside>
  )
}

export default AdminSidebar
