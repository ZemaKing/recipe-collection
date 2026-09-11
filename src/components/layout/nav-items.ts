import {
  BookOpen,
  CalendarDays,
  Clock,
  Heart,
  Home,
  LayoutGrid,
  NotebookPen,
  User,
  type LucideIcon,
} from 'lucide-react'
import { categoryIconBySlug } from '@/lib/categoryIcons'

export interface NavItem {
  labelKey: string
  path: string
  icon: LucideIcon
}

export const primaryNavItems: NavItem[] = [
  { labelKey: 'nav.home', path: '/', icon: Home },
  { labelKey: 'nav.allRecipes', path: '/recepti', icon: BookOpen },
  { labelKey: 'nav.categories', path: '/kategorije', icon: LayoutGrid },
  { labelKey: 'nav.favorites', path: '/omiljeni', icon: Heart },
  { labelKey: 'nav.recentlyAdded', path: '/nedavno-dodati', icon: Clock },
  { labelKey: 'nav.mealPlan', path: '/plan-obroka', icon: CalendarDays },
  { labelKey: 'nav.kitchenNotes', path: '/beleske', icon: NotebookPen },
]

export const categoryNavItems: NavItem[] = [
  { labelKey: 'category.breakfast', path: '/kategorije/dorucak', icon: categoryIconBySlug.dorucak },
  {
    labelKey: 'category.soups',
    path: '/kategorije/supe-i-corbe',
    icon: categoryIconBySlug['supe-i-corbe'],
  },
  {
    labelKey: 'category.mainDishes',
    path: '/kategorije/glavna-jela',
    icon: categoryIconBySlug['glavna-jela'],
  },
  { labelKey: 'category.salads', path: '/kategorije/salate', icon: categoryIconBySlug.salate },
  { labelKey: 'category.sideDishes', path: '/kategorije/prilozi', icon: categoryIconBySlug.prilozi },
  { labelKey: 'category.desserts', path: '/kategorije/deserti', icon: categoryIconBySlug.deserti },
  { labelKey: 'category.pastries', path: '/kategorije/peciva', icon: categoryIconBySlug.peciva },
  {
    labelKey: 'category.drinks',
    path: '/kategorije/pica-i-napici',
    icon: categoryIconBySlug['pica-i-napici'],
  },
  { labelKey: 'category.other', path: '/kategorije/ostalo', icon: categoryIconBySlug.ostalo },
]

export const bottomTabItems: NavItem[] = [
  { labelKey: 'nav.home', path: '/', icon: Home },
  { labelKey: 'nav.categories', path: '/kategorije', icon: LayoutGrid },
  { labelKey: 'nav.favorites', path: '/omiljeni', icon: Heart },
  { labelKey: 'nav.profile', path: '/profil', icon: User },
]

export const adminNavItems: NavItem[] = [
  { labelKey: 'admin.nav.recipes', path: '/admin/recepti', icon: BookOpen },
  { labelKey: 'admin.nav.mealPlan', path: '/admin/plan-obroka', icon: CalendarDays },
  { labelKey: 'admin.nav.notes', path: '/admin/beleske', icon: NotebookPen },
]
