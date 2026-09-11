import type { MealSlot } from '@/lib/weekDates'

export interface MealPlanRecipeRef {
  id: string
  slug: string
  name_en: string
  name_sr: string | null
}

export interface MealPlanEntry {
  id: string
  plan_date: string
  slot: MealSlot
  note: string | null
  // Null when the entry's recipe was deleted (set-null on delete) — rendered as "recipe removed".
  recipe: MealPlanRecipeRef | null
}
