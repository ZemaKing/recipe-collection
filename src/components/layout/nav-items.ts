import {
  BookOpen,
  CalendarDays,
  Carrot,
  Clock,
  Heart,
  Home,
  LayoutGrid,
  NotebookPen,
  User,
  type LucideIcon,
} from 'lucide-react'

export interface NavItem {
  // Either labelKey (resolved via i18n) or label (a literal, pre-resolved
  // string, e.g. a bilingual category name from the database) must be set.
  labelKey?: string
  label?: string
  path: string
  icon: LucideIcon
}

export const primaryNavItems: NavItem[] = [
  { labelKey: 'nav.home', path: '/', icon: Home },
  { labelKey: 'nav.allRecipes', path: '/recepti', icon: BookOpen },
  { labelKey: 'nav.categories', path: '/kategorije', icon: LayoutGrid },
  { labelKey: 'nav.favorites', path: '/omiljeni', icon: Heart },
  { labelKey: 'nav.recentlyAdded', path: '/nedavno-dodati', icon: Clock },
]

export const bottomTabItems: NavItem[] = [
  { labelKey: 'nav.home', path: '/', icon: Home },
  { labelKey: 'nav.categories', path: '/kategorije', icon: LayoutGrid },
  { labelKey: 'nav.favorites', path: '/omiljeni', icon: Heart },
  { labelKey: 'nav.profile', path: '/profil', icon: User },
]

export const adminNavItems: NavItem[] = [
  { labelKey: 'admin.nav.recipes', path: '/admin/recepti', icon: BookOpen },
  { labelKey: 'admin.nav.ingredients', path: '/admin/sastojci', icon: Carrot },
  { labelKey: 'admin.nav.mealPlan', path: '/admin/plan-obroka', icon: CalendarDays },
  { labelKey: 'admin.nav.notes', path: '/admin/beleske', icon: NotebookPen },
  { labelKey: 'admin.nav.categories', path: '/admin/kategorije', icon: LayoutGrid },
]
