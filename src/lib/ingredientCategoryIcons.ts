import {
  Apple,
  Beef,
  Candy,
  Carrot,
  Droplet,
  Egg,
  Fish,
  GlassWater,
  Leaf,
  Milk,
  Tag,
  Wheat,
  type LucideIcon,
} from 'lucide-react'
import MushroomIcon from '@/components/icons/MushroomIcon'

// Structurally the same shape as a LucideIcon (just an optional className),
// so the custom MushroomIcon illustration can live in this map too — see
// src/lib/tagIcons.ts for the same pattern with MomIcon.
type IngredientCategoryIcon = LucideIcon | ((props: { className?: string }) => React.JSX.Element)

export const ingredientCategoryIconBySlug: Record<string, IngredientCategoryIcon> = {
  'mleko-i-mlecni-proizvodi': Milk,
  'meso-i-mesne-preradjevine': Beef,
  'riba-i-morski-plodovi': Fish,
  jaja: Egg,
  povrce: Carrot,
  voce: Apple,
  pecurke: MushroomIcon,
  'zitarice-testenine-i-peciva': Wheat,
  'zacini-i-zacinsko-bilje': Leaf,
  'ulja-i-masti': Droplet,
  'seceri-i-zasladjivaci': Candy,
  'pica-i-tecnosti': GlassWater,
}

export function getIngredientCategoryIcon(slug: string): IngredientCategoryIcon {
  return ingredientCategoryIconBySlug[slug] ?? Tag
}

export interface IngredientCategoryColorClasses {
  bgSoft: string
  text: string
}

const DEFAULT_COLORS: IngredientCategoryColorClasses = { bgSoft: 'bg-accent-soft', text: 'text-accent' }

const INGREDIENT_CATEGORY_COLORS: Record<string, IngredientCategoryColorClasses> = {
  'mleko-i-mlecni-proizvodi': { bgSoft: 'bg-blue-500/15', text: 'text-blue-400' },
  'meso-i-mesne-preradjevine': { bgSoft: 'bg-rose-500/15', text: 'text-rose-400' },
  'riba-i-morski-plodovi': { bgSoft: 'bg-sky-500/15', text: 'text-sky-400' },
  jaja: { bgSoft: 'bg-orange-500/15', text: 'text-orange-400' },
  povrce: { bgSoft: 'bg-emerald-500/15', text: 'text-emerald-400' },
  voce: { bgSoft: 'bg-red-500/15', text: 'text-red-400' },
  pecurke: { bgSoft: 'bg-violet-500/15', text: 'text-violet-400' },
  'zitarice-testenine-i-peciva': { bgSoft: 'bg-amber-500/15', text: 'text-amber-400' },
  'zacini-i-zacinsko-bilje': { bgSoft: 'bg-green-500/15', text: 'text-green-400' },
  'ulja-i-masti': { bgSoft: 'bg-yellow-500/15', text: 'text-yellow-400' },
  'seceri-i-zasladjivaci': { bgSoft: 'bg-purple-500/15', text: 'text-purple-400' },
  'pica-i-tecnosti': { bgSoft: 'bg-teal-500/15', text: 'text-teal-400' },
}

export function getIngredientCategoryColors(slug: string): IngredientCategoryColorClasses {
  return INGREDIENT_CATEGORY_COLORS[slug] ?? DEFAULT_COLORS
}
