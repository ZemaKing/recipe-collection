import { ChefHat, Heart, Leaf, Sprout, Tag, Timer, WheatOff, type LucideIcon } from 'lucide-react'

export const tagIconBySlug: Record<string, LucideIcon> = {
  'za-pocetnike': ChefHat,
  'bez-glutena': WheatOff,
  'brzi-recepti': Timer,
  'sezonski-recepti': Leaf,
  vegetarijanski: Sprout,
  'mamin-recept': Heart,
}

export function getTagIcon(slug: string): LucideIcon {
  return tagIconBySlug[slug] ?? Tag
}

export interface TagColorClasses {
  text: string
  bgSoft: string
  border: string
}

const TAG_COLOR_OVERRIDES: Record<string, TagColorClasses> = {
  // "From Mom" gets its own pink/red identity instead of the shared green
  // used by every other tag — reuses the existing favorite token rather
  // than introducing a new color.
  'mamin-recept': { text: 'text-favorite', bgSoft: 'bg-favorite/10', border: 'border-favorite' },
}

const DEFAULT_TAG_COLORS: TagColorClasses = { text: 'text-tag', bgSoft: 'bg-tag-soft', border: 'border-tag' }

export function getTagColors(slug: string): TagColorClasses {
  return TAG_COLOR_OVERRIDES[slug] ?? DEFAULT_TAG_COLORS
}
