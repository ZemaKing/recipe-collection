import { ChefHat, Leaf, Sprout, Tag, Timer, WheatOff, type LucideIcon } from 'lucide-react'
import MomIcon from '@/components/icons/MomIcon'

// The one tag that gets pinned to the top of every tag list and its own
// pink/red color instead of the shared green — kept as a single exported
// constant so the ordering/divider logic elsewhere only names it once.
export const PINNED_TAG_SLUG = 'mamin-recept'

// Lucide icons and the custom MomIcon both just take an optional className,
// so a shared structural type lets both live in the same lookup map.
type TagIcon = LucideIcon | ((props: { className?: string }) => React.JSX.Element)

export const tagIconBySlug: Record<string, TagIcon> = {
  'za-pocetnike': ChefHat,
  'bez-glutena': WheatOff,
  'brzi-recepti': Timer,
  'sezonski-recepti': Leaf,
  vegetarijanski: Sprout,
  // Custom illustration (not Heart/Gift) — a heart icon here would read as
  // "favorite" next to the actual favorite-toggle heart used elsewhere.
  [PINNED_TAG_SLUG]: MomIcon,
}

export function getTagIcon(slug: string): TagIcon {
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
