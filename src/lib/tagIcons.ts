import { ChefHat, Leaf, Sprout, Tag, Timer, WheatOff, type LucideIcon } from 'lucide-react'

export const tagIconBySlug: Record<string, LucideIcon> = {
  'za-pocetnike': ChefHat,
  'bez-glutena': WheatOff,
  'brzi-recepti': Timer,
  'sezonski-recepti': Leaf,
  vegetarijanski: Sprout,
}

export function getTagIcon(slug: string): LucideIcon {
  return tagIconBySlug[slug] ?? Tag
}
