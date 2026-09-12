import { useTranslation } from 'react-i18next'
import { NavLink } from 'react-router-dom'
import { useCurrentLang } from '@/hooks/useCurrentLang'
import { buildLocalizedPath } from '@/lib/localizedPath'
import { cn } from '@/lib/utils'
import type { NavItem } from './nav-items'

function NavRow({ path, icon: Icon, labelKey, label: literalLabel }: NavItem) {
  const { t } = useTranslation()
  const lang = useCurrentLang()
  const label = literalLabel ?? (labelKey ? t(labelKey) : '')
  const to = buildLocalizedPath(lang, path)

  return (
    <NavLink
      to={to}
      end={path === '/'}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 rounded-control px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-surface-hover hover:text-foreground md:justify-center lg:justify-start',
          isActive && 'bg-accent-soft text-accent hover:bg-accent-soft hover:text-accent',
        )
      }
      title={label}
      aria-label={label}
    >
      <Icon className="size-5 shrink-0" />
      <span className="hidden lg:inline">{label}</span>
    </NavLink>
  )
}

export default NavRow
