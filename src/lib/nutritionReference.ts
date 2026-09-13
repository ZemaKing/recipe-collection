// Standard adult daily-value references, used only to compute the "%DV"
// shown on each micronutrient card — nothing here is stored in the database.
interface DailyValueRef {
  amount: number
  unit: string
  label_en: string
  label_sr: string
}

export const DAILY_VALUES: Record<string, DailyValueRef> = {
  vitamin_a: { amount: 900, unit: 'µg', label_en: 'Vitamin A', label_sr: 'Vitamin A' },
  vitamin_c: { amount: 90, unit: 'mg', label_en: 'Vitamin C', label_sr: 'Vitamin C' },
  vitamin_d: { amount: 20, unit: 'µg', label_en: 'Vitamin D', label_sr: 'Vitamin D' },
  vitamin_e: { amount: 15, unit: 'mg', label_en: 'Vitamin E', label_sr: 'Vitamin E' },
  vitamin_b12: { amount: 2.4, unit: 'µg', label_en: 'Vitamin B12', label_sr: 'Vitamin B12' },
  calcium: { amount: 1300, unit: 'mg', label_en: 'Calcium', label_sr: 'Kalcijum' },
  iron: { amount: 18, unit: 'mg', label_en: 'Iron', label_sr: 'Gvožđe' },
  potassium: { amount: 4700, unit: 'mg', label_en: 'Potassium', label_sr: 'Kalijum' },
  magnesium: { amount: 420, unit: 'mg', label_en: 'Magnesium', label_sr: 'Magnezijum' },
  zinc: { amount: 11, unit: 'mg', label_en: 'Zinc', label_sr: 'Cink' },
  sodium: { amount: 2300, unit: 'mg', label_en: 'Sodium', label_sr: 'Natrijum' },
}

export function calculatePercentDV(key: string, amount: number): number | null {
  const ref = DAILY_VALUES[key]
  if (!ref || ref.amount <= 0) return null
  return Math.round((amount / ref.amount) * 100)
}

// Standard adult daily reference values for the five macros shown on the
// nutrition panel's top row (used only for the "% of DV" meter, same as
// DAILY_VALUES above for micronutrients).
export const MACRO_DAILY_VALUES: Record<'calories' | 'protein' | 'fat' | 'carbs' | 'fiber', number> = {
  calories: 2000,
  protein: 50,
  fat: 70,
  carbs: 275,
  fiber: 28,
}

export function calculateMacroPercentDV(key: keyof typeof MACRO_DAILY_VALUES, amount: number): number {
  return Math.round((amount / MACRO_DAILY_VALUES[key]) * 100)
}

function humanizeKey(key: string): string {
  return key
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

export function getNutrientLabel(key: string, lang: 'en' | 'sr'): string {
  const ref = DAILY_VALUES[key]
  if (ref) return lang === 'sr' ? ref.label_sr : ref.label_en
  return humanizeKey(key)
}

// Maps the legacy free-text micronutrient keys to their real vitamin/mineral
// catalog codes (see supabase/migrations/20260913120000_vitamins_minerals_catalog.sql)
// so the recipe-detail nutrition panel can show e.g. "Ca"/"K" instead of a
// guessed initial. Falls back to the label's first letter for any key that
// predates this list (this panel still reads the legacy micronutrients jsonb
// column, not the new vitamins/minerals tables).
const NUTRIENT_CODES: Record<string, string> = {
  vitamin_a: 'A',
  vitamin_c: 'C',
  vitamin_d: 'D',
  vitamin_e: 'E',
  vitamin_b12: 'B12',
  calcium: 'Ca',
  iron: 'Fe',
  potassium: 'K',
  magnesium: 'Mg',
  zinc: 'Zn',
  sodium: 'Na',
}

export function getNutrientCode(key: string, label: string): string {
  return NUTRIENT_CODES[key] ?? label.charAt(0).toUpperCase()
}
