import { ArrowLeft } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { NavLink } from 'react-router-dom'
import { useCurrentLang } from '@/hooks/useCurrentLang'
import { buildLocalizedPath } from '@/lib/localizedPath'
import { cn } from '@/lib/utils'
import { adminNavItems } from './nav-items'

function AdminBottomTabBar() {
  const { t } = useTranslation()
  const lang = useCurrentLang()

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex items-start justify-around border-t border-border bg-surface px-2 py-2 md:hidden">
      {adminNavItems.map((item) => (
        <NavLink
          key={item.path}
          to={buildLocalizedPath(lang, item.path)}
          className={({ isActive }) =>
            cn(
              'flex flex-col items-center gap-1 rounded-control px-2 py-1 text-center text-xs leading-tight text-muted-foreground',
              isActive && 'text-accent',
            )
          }
        >
          <item.icon className="size-5 shrink-0" />
          {t(item.labelKey)}
        </NavLink>
      ))}

      <NavLink
        to={buildLocalizedPath(lang, '/')}
        className="flex flex-col items-center gap-1 rounded-control px-2 py-1 text-center text-xs leading-tight text-muted-foreground"
      >
        <ArrowLeft className="size-5 shrink-0" />
        {t('admin.backToSite')}
      </NavLink>
    </nav>
  )
}

export default AdminBottomTabBar
