import {
  BookOpen,
  CakeSlice,
  CalendarDays,
  Clock,
  Croissant,
  CupSoda,
  Egg,
  Heart,
  Home,
  LayoutGrid,
  MoreHorizontal,
  NotebookPen,
  Salad,
  Sandwich,
  Soup,
  User,
  UtensilsCrossed,
  type LucideIcon,
} from 'lucide-react'

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
  { labelKey: 'category.breakfast', path: '/kategorije/dorucak', icon: Egg },
  { labelKey: 'category.soups', path: '/kategorije/supe-i-corbe', icon: Soup },
  { labelKey: 'category.mainDishes', path: '/kategorije/glavna-jela', icon: UtensilsCrossed },
  { labelKey: 'category.salads', path: '/kategorije/salate', icon: Salad },
  { labelKey: 'category.sideDishes', path: '/kategorije/prilozi', icon: Sandwich },
  { labelKey: 'category.desserts', path: '/kategorije/deserti', icon: CakeSlice },
  { labelKey: 'category.pastries', path: '/kategorije/peciva', icon: Croissant },
  { labelKey: 'category.drinks', path: '/kategorije/pica-i-napici', icon: CupSoda },
  { labelKey: 'category.other', path: '/kategorije/ostalo', icon: MoreHorizontal },
]

export const bottomTabItems: NavItem[] = [
  { labelKey: 'nav.home', path: '/', icon: Home },
  { labelKey: 'nav.categories', path: '/kategorije', icon: LayoutGrid },
  { labelKey: 'nav.favorites', path: '/omiljeni', icon: Heart },
  { labelKey: 'nav.profile', path: '/profil', icon: User },
]
