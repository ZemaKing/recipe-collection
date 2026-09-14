import {
  CakeSlice,
  Croissant,
  CupSoda,
  Droplets,
  Drumstick,
  Egg,
  MoreHorizontal,
  Salad,
  Sandwich,
  Soup,
  UtensilsCrossed,
  type LucideIcon,
} from 'lucide-react'

export const categoryIconBySlug: Record<string, LucideIcon> = {
  dorucak: Egg,
  'supe-i-corbe': Soup,
  'glavna-jela': UtensilsCrossed,
  salate: Salad,
  prilozi: Sandwich,
  deserti: CakeSlice,
  peciva: Croissant,
  'sosovi-prelivi-i-namazi': Droplets,
  'pica-i-napici': CupSoda,
  predjela: Drumstick,
  ostalo: MoreHorizontal,
}

export function getCategoryIcon(slug: string): LucideIcon {
  return categoryIconBySlug[slug] ?? MoreHorizontal
}
