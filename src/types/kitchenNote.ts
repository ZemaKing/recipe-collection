export interface KitchenNoteRecipeRef {
  id: string
  slug: string
  name_en: string
  name_sr: string | null
}

export interface KitchenNote {
  id: string
  title_en: string
  title_sr: string | null
  body_en: string | null
  body_sr: string | null
  is_pinned: boolean
  created_at: string
  recipe: KitchenNoteRecipeRef | null
}
