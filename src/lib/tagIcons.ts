import { ChefHat, Gift, Leaf, Sprout, Tag, Timer, WheatOff, type LucideIcon } from 'lucide-react'

// The one tag that gets pinned to the top of every tag list and its own
// pink/red color instead of the shared green — kept as a single exported
// constant so the ordering/divider logic elsewhere only names it once.
export const PINNED_TAG_SLUG = 'mamin-recept'

export const tagIconBySlug: Record<string, LucideIcon> = {
  'za-pocetnike': ChefHat,
  'bez-glutena': WheatOff,
  'brzi-recepti': Timer,
  'sezonski-recepti': Leaf,
  vegetarijanski: Sprout,
  // Gift (not Heart) — a heart icon here would read as "favorite" next to
  // the actual favorite-toggle heart used elsewhere in the app.
  [PINNED_TAG_SLUG]: Gift,
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
  [PINNED_TAG_SLUG]: { text: 'text-favorite', bgSoft: 'bg-favorite/10', border: 'border-favorite' },
}

const DEFAULT_TAG_COLORS: TagColorClasses = { text: 'text-tag', bgSoft: 'bg-tag-soft', border: 'border-tag' }

export function getTagColors(slug: string): TagColorClasses {
  return TAG_COLOR_OVERRIDES[slug] ?? DEFAULT_TAG_COLORS
}
