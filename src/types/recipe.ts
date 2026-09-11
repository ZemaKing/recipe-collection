export interface RecipeSummary {
  id: string
  slug: string
  name_en: string
  name_sr: string | null
  prep_time_minutes: number | null
  cook_time_minutes: number | null
  rating: number
  is_favorite: boolean
  category: { slug: string; name_en: string; name_sr: string | null } | null
}
