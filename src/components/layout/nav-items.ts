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
  label: string
  path: string
  icon: LucideIcon
}

export const primaryNavItems: NavItem[] = [
  { label: 'Početna', path: '/', icon: Home },
  { label: 'Svi recepti', path: '/recepti', icon: BookOpen },
  { label: 'Kategorije', path: '/kategorije', icon: LayoutGrid },
  { label: 'Omiljeni', path: '/omiljeni', icon: Heart },
  { label: 'Nedavno dodati', path: '/nedavno-dodati', icon: Clock },
  { label: 'Plan obroka', path: '/plan-obroka', icon: CalendarDays },
  { label: 'Kuhinjske beleške', path: '/beleske', icon: NotebookPen },
]

export const categoryNavItems: NavItem[] = [
  { label: 'Doručak', path: '/kategorije/dorucak', icon: Egg },
  { label: 'Supe i čorbe', path: '/kategorije/supe-i-corbe', icon: Soup },
  { label: 'Glavna jela', path: '/kategorije/glavna-jela', icon: UtensilsCrossed },
  { label: 'Salate', path: '/kategorije/salate', icon: Salad },
  { label: 'Prilozi', path: '/kategorije/prilozi', icon: Sandwich },
  { label: 'Deserti', path: '/kategorije/deserti', icon: CakeSlice },
  { label: 'Peciva', path: '/kategorije/peciva', icon: Croissant },
  { label: 'Pića i napici', path: '/kategorije/pica-i-napici', icon: CupSoda },
  { label: 'Ostalo', path: '/kategorije/ostalo', icon: MoreHorizontal },
]

export const bottomTabItems: NavItem[] = [
  { label: 'Početna', path: '/', icon: Home },
  { label: 'Kategorije', path: '/kategorije', icon: LayoutGrid },
  { label: 'Omiljeni', path: '/omiljeni', icon: Heart },
  { label: 'Profil', path: '/profil', icon: User },
]
