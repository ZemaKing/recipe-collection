import { Droplet, Drumstick, Flame, Leaf, type LucideIcon, Wheat } from 'lucide-react'

export interface MacroIconConfig {
  icon: LucideIcon
  colorClass: string
  bgClass: string
}

// Distinct per-nutrient colors are intentional here (matches the mockup's
// "nutrition facts label" visual language) rather than the app's semantic
// accent/favorite tokens, which don't cover this many hues.
export const macroIcons: Record<'calories' | 'protein' | 'fat' | 'carbs' | 'fiber', MacroIconConfig> = {
  calories: { icon: Flame, colorClass: 'text-orange-400', bgClass: 'bg-orange-400/10' },
  protein: { icon: Drumstick, colorClass: 'text-emerald-400', bgClass: 'bg-emerald-400/10' },
  fat: { icon: Droplet, colorClass: 'text-sky-400', bgClass: 'bg-sky-400/10' },
  carbs: { icon: Wheat, colorClass: 'text-violet-400', bgClass: 'bg-violet-400/10' },
  fiber: { icon: Leaf, colorClass: 'text-green-400', bgClass: 'bg-green-400/10' },
}

const micronutrientColors: Record<string, string> = {
  vitamin_a: 'text-orange-400 bg-orange-400/10',
  vitamin_c: 'text-emerald-400 bg-emerald-400/10',
  vitamin_d: 'text-amber-400 bg-amber-400/10',
  vitamin_e: 'text-lime-400 bg-lime-400/10',
  vitamin_b12: 'text-pink-400 bg-pink-400/10',
  calcium: 'text-sky-400 bg-sky-400/10',
  iron: 'text-rose-400 bg-rose-400/10',
  potassium: 'text-teal-400 bg-teal-400/10',
  magnesium: 'text-indigo-400 bg-indigo-400/10',
  zinc: 'text-fuchsia-400 bg-fuchsia-400/10',
  sodium: 'text-cyan-400 bg-cyan-400/10',
}

const defaultMicronutrientColor = 'text-muted-foreground bg-surface-elevated'

export function getMicronutrientColorClass(key: string): string {
  return micronutrientColors[key] ?? defaultMicronutrientColor
}
