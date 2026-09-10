import { ChefHat, Plus } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { categoryNavItems, primaryNavItems } from './nav-items'

function NavRow({
  path,
  icon: Icon,
  label,
}: {
  path: string
  icon: (typeof primaryNavItems)[number]['icon']
  label: string
}) {
  return (
    <NavLink
      to={path}
      end={path === '/'}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 rounded-control px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-surface-hover hover:text-foreground md:justify-center lg:justify-start',
          isActive && 'bg-accent-soft text-accent hover:bg-accent-soft hover:text-accent',
        )
      }
      title={label}
    >
      <Icon className="size-5 shrink-0" />
      <span className="hidden lg:inline">{label}</span>
    </NavLink>
  )
}

function Sidebar() {
  return (
    <aside className="hidden shrink-0 flex-col border-r border-border bg-surface md:flex md:w-20 lg:w-64">
      <div className="flex items-center gap-2 px-4 py-5 lg:px-6">
        <ChefHat className="size-7 shrink-0 text-accent" />
        <span className="hidden text-lg font-semibold lg:inline">Moji Recepti</span>
      </div>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3">
        {primaryNavItems.map((item) => (
          <NavRow key={item.path} {...item} />
        ))}

        <div className="mt-6 hidden lg:block">
          <p className="px-3 pb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Kategorije
          </p>
          <div className="flex flex-col gap-1">
            {categoryNavItems.map((item) => (
              <NavRow key={item.path} {...item} />
            ))}
          </div>
        </div>
      </nav>

      <div className="border-t border-border p-3">
        <NavLink
          to="/admin/recepti/novi"
          className="flex items-center justify-center gap-2 rounded-control bg-accent px-3 py-2 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent-hover"
          title="Dodaj recept"
        >
          <Plus className="size-4 shrink-0" />
          <span className="hidden lg:inline">Dodaj recept</span>
        </NavLink>
      </div>
    </aside>
  )
}

export default Sidebar
