import { Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { NavLink } from 'react-router-dom'
import { useCurrentLang } from '@/hooks/useCurrentLang'
import { buildLocalizedPath } from '@/lib/localizedPath'
import { cn } from '@/lib/utils'
import { bottomTabItems } from './nav-items'

function BottomTabBar() {
  const { t } = useTranslation()
  const lang = useCurrentLang()
  const [first, second, ...rest] = bottomTabItems

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 items-center border-t border-border bg-surface px-2 py-2 md:hidden">
      {[first, second].map((item) => (
        <NavLink
          key={item.path}
          to={buildLocalizedPath(lang, item.path)}
          end={item.path === '/'}
          className={({ isActive }) =>
            cn(
              'flex flex-col items-center gap-1 justify-self-center rounded-control px-3 py-1 text-xs text-muted-foreground',
              isActive && 'text-accent',
            )
          }
        >
          <item.icon className="size-5" />
          {t(item.labelKey)}
        </NavLink>
      ))}

      <NavLink
        to={buildLocalizedPath(lang, '/admin/recepti/novi')}
        className="-mt-6 flex size-12 shrink-0 items-center justify-center justify-self-center rounded-full bg-accent text-accent-foreground shadow-lg transition-colors hover:bg-accent-hover"
        title={t('nav.addRecipe')}
      >
        <Plus className="size-6" />
      </NavLink>

      {rest.map((item) => (
        <NavLink
          key={item.path}
          to={buildLocalizedPath(lang, item.path)}
          className={({ isActive }) =>
            cn(
              'flex flex-col items-center gap-1 justify-self-center rounded-control px-3 py-1 text-xs text-muted-foreground',
              isActive && 'text-accent',
            )
          }
        >
          <item.icon className="size-5" />
          {t(item.labelKey)}
        </NavLink>
      ))}
    </nav>
  )
}

export default BottomTabBar
