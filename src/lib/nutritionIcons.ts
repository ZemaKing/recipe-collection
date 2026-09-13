import { Droplet, Drumstick, Flame, Leaf, type LucideIcon, Wheat } from 'lucide-react'

export interface MacroIconConfig {
  icon: LucideIcon
  colorClass: string
  badgeBgClass: string
  barClass: string
  trackClass: string
}

// Distinct per-nutrient colors are intentional here (matches the mockup's
// "nutrition facts label" visual language) rather than the app's semantic
// accent/favorite tokens, which don't cover this many hues. Each nutrient
// keeps one hue across its icon badge, its meter fill, and the meter's
// track (a lighter step of the same hue), so identity reads consistently.
export const macroIcons: Record<'calories' | 'protein' | 'fat' | 'carbs' | 'fiber', MacroIconConfig> = {
  calories: {
    icon: Flame,
    colorClass: 'text-orange-400',
    badgeBgClass: 'bg-orange-400/10',
    barClass: 'bg-orange-400',
    trackClass: 'bg-orange-400/15',
  },
  protein: {
    icon: Drumstick,
    colorClass: 'text-emerald-400',
    badgeBgClass: 'bg-emerald-400/10',
    barClass: 'bg-emerald-400',
    trackClass: 'bg-emerald-400/15',
  },
  fat: {
    icon: Droplet,
    colorClass: 'text-sky-400',
    badgeBgClass: 'bg-sky-400/10',
    barClass: 'bg-sky-400',
    trackClass: 'bg-sky-400/15',
  },
  carbs: {
    icon: Wheat,
    colorClass: 'text-violet-400',
    badgeBgClass: 'bg-violet-400/10',
    barClass: 'bg-violet-400',
    trackClass: 'bg-violet-400/15',
  },
  fiber: {
    icon: Leaf,
    colorClass: 'text-green-400',
    badgeBgClass: 'bg-green-400/10',
    barClass: 'bg-green-400',
    trackClass: 'bg-green-400/15',
  },
}

export interface MicronutrientColorConfig {
  colorClass: string
  badgeBgClass: string
  barClass: string
  trackClass: string
  pillClass: string
}

const micronutrientColors: Record<string, MicronutrientColorConfig> = {
  vitamin_a: {
    colorClass: 'text-orange-400',
    badgeBgClass: 'bg-orange-400/15',
    barClass: 'bg-orange-400',
    trackClass: 'bg-orange-400/15',
    pillClass: 'bg-orange-400/15 text-orange-400',
  },
  vitamin_c: {
    colorClass: 'text-emerald-400',
    badgeBgClass: 'bg-emerald-400/15',
    barClass: 'bg-emerald-400',
    trackClass: 'bg-emerald-400/15',
    pillClass: 'bg-emerald-400/15 text-emerald-400',
  },
  vitamin_d: {
    colorClass: 'text-amber-400',
    badgeBgClass: 'bg-amber-400/15',
    barClass: 'bg-amber-400',
    trackClass: 'bg-amber-400/15',
    pillClass: 'bg-amber-400/15 text-amber-400',
  },
  vitamin_e: {
    colorClass: 'text-lime-400',
    badgeBgClass: 'bg-lime-400/15',
    barClass: 'bg-lime-400',
    trackClass: 'bg-lime-400/15',
    pillClass: 'bg-lime-400/15 text-lime-400',
  },
  vitamin_b12: {
    colorClass: 'text-pink-400',
    badgeBgClass: 'bg-pink-400/15',
    barClass: 'bg-pink-400',
    trackClass: 'bg-pink-400/15',
    pillClass: 'bg-pink-400/15 text-pink-400',
  },
  calcium: {
    colorClass: 'text-sky-400',
    badgeBgClass: 'bg-sky-400/15',
    barClass: 'bg-sky-400',
    trackClass: 'bg-sky-400/15',
    pillClass: 'bg-sky-400/15 text-sky-400',
  },
  iron: {
    colorClass: 'text-rose-400',
    badgeBgClass: 'bg-rose-400/15',
    barClass: 'bg-rose-400',
    trackClass: 'bg-rose-400/15',
    pillClass: 'bg-rose-400/15 text-rose-400',
  },
  potassium: {
    colorClass: 'text-teal-400',
    badgeBgClass: 'bg-teal-400/15',
    barClass: 'bg-teal-400',
    trackClass: 'bg-teal-400/15',
    pillClass: 'bg-teal-400/15 text-teal-400',
  },
  magnesium: {
    colorClass: 'text-indigo-400',
    badgeBgClass: 'bg-indigo-400/15',
    barClass: 'bg-indigo-400',
    trackClass: 'bg-indigo-400/15',
    pillClass: 'bg-indigo-400/15 text-indigo-400',
  },
  zinc: {
    colorClass: 'text-fuchsia-400',
    badgeBgClass: 'bg-fuchsia-400/15',
    barClass: 'bg-fuchsia-400',
    trackClass: 'bg-fuchsia-400/15',
    pillClass: 'bg-fuchsia-400/15 text-fuchsia-400',
  },
  sodium: {
    colorClass: 'text-cyan-400',
    badgeBgClass: 'bg-cyan-400/15',
    barClass: 'bg-cyan-400',
    trackClass: 'bg-cyan-400/15',
    pillClass: 'bg-cyan-400/15 text-cyan-400',
  },
}

const defaultMicronutrientColor: MicronutrientColorConfig = {
  colorClass: 'text-muted-foreground',
  badgeBgClass: 'bg-surface',
  barClass: 'bg-muted-foreground',
  trackClass: 'bg-muted-foreground/15',
  pillClass: 'bg-surface text-muted-foreground',
}

export function getMicronutrientColors(key: string): MicronutrientColorConfig {
  return micronutrientColors[key] ?? defaultMicronutrientColor
}
