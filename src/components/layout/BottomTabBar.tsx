import { Plus } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { bottomTabItems } from './nav-items'

function BottomTabBar() {
  const [first, second, ...rest] = bottomTabItems

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-around border-t border-border bg-surface px-2 py-2 md:hidden">
      {[first, second].map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          end={item.path === '/'}
          className={({ isActive }) =>
            cn(
              'flex flex-col items-center gap-1 rounded-control px-3 py-1 text-xs text-muted-foreground',
              isActive && 'text-accent',
            )
          }
        >
          <item.icon className="size-5" />
          {item.label}
        </NavLink>
      ))}

      <NavLink
        to="/admin/recepti/novi"
        className="-mt-6 flex size-12 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-lg transition-colors hover:bg-accent-hover"
        title="Dodaj recept"
      >
        <Plus className="size-6" />
      </NavLink>

      {rest.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) =>
            cn(
              'flex flex-col items-center gap-1 rounded-control px-3 py-1 text-xs text-muted-foreground',
              isActive && 'text-accent',
            )
          }
        >
          <item.icon className="size-5" />
          {item.label}
        </NavLink>
      ))}
    </nav>
  )
}

export default BottomTabBar
