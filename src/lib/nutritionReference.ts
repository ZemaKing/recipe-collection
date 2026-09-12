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
