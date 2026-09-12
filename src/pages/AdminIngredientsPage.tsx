import { useMemo, useState } from 'react'
import { Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import DeleteIngredientDialog from '@/components/admin/DeleteIngredientDialog'
import { useCurrentLang } from '@/hooks/useCurrentLang'
import { useDeleteIngredient } from '@/hooks/useDeleteIngredient'
import { useIngredientCategories } from '@/hooks/useIngredientCategories'
import { type IngredientWithCategory, useIngredients } from '@/hooks/useIngredients'
import { pickLocalized } from '@/lib/localizedField'
import { buildLocalizedPath } from '@/lib/localizedPath'

const inputClass =
  'rounded-control border border-border bg-surface-elevated px-2.5 py-1.5 text-sm text-foreground placeholder:text-muted-foreground'

function AdminIngredientsPage() {
  const { t } = useTranslation()
  const lang = useCurrentLang()
  const { ingredients, isLoading, refetch } = useIngredients()
  const { categories } = useIngredientCategories()
  const { deleteIngredient, isDeleting, error: deleteError } = useDeleteIngredient()

  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [pendingDelete, setPendingDelete] = useState<IngredientWithCategory | null>(null)

  const visible = useMemo(() => {
    const query = search.trim().toLowerCase()
    return ingredients.filter((ingredient) => {
      if (categoryFilter && ingredient.ingredient_category_id !== categoryFilter) return false
      if (!query) return true
      return (
        ingredient.name_en.toLowerCase().includes(query) ||
        (ingredient.name_sr?.toLowerCase().includes(query) ?? false)
      )
    })
  }, [ingredients, search, categoryFilter])

  async function handleConfirmDelete() {
    if (!pendingDelete) return
    await deleteIngredient(pendingDelete.id)
    setPendingDelete(null)
    refetch()
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">
          {t('admin.nav.ingredients')}
          {!isLoading && ` (${ingredients.length})`}
        </h1>
        <Link
          to={buildLocalizedPath(lang, '/admin/sastojci/novi')}
          className="flex items-center gap-1.5 rounded-control bg-accent px-3 py-2 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent-hover"
        >
          <Plus className="size-4" />
          {t('admin.ingredients.addIngredient')}
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t('admin.ingredients.searchPlaceholder')}
            className={`${inputClass} w-full pl-8`}
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(event) => setCategoryFilter(event.target.value)}
          className={inputClass}
        >
          <option value="">{t('admin.ingredients.allCategories')}</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {pickLocalized(category.name_en, category.name_sr, lang)}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto rounded-card border border-border bg-surface">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs text-muted-foreground uppercase">
              <th className="px-4 py-3 font-medium">{t('admin.ingredients.columnNameEn')}</th>
              <th className="px-4 py-3 font-medium">{t('admin.ingredients.columnNameSr')}</th>
              <th className="px-4 py-3 font-medium">{t('admin.ingredients.columnCategory')}</th>
              <th className="px-4 py-3 font-medium">{t('admin.ingredients.columnCalories')}</th>
              <th className="px-4 py-3 font-medium">{t('admin.ingredients.columnActions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {visible.map((ingredient) => (
              <tr key={ingredient.id}>
                <td className="px-4 py-3 font-medium text-foreground">{ingredient.name_en}</td>
                <td className="px-4 py-3 text-muted-foreground">{ingredient.name_sr ?? '—'}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {ingredient.ingredient_category
                    ? pickLocalized(
                        ingredient.ingredient_category.name_en,
                        ingredient.ingredient_category.name_sr,
                        lang,
                      )
                    : '—'}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {ingredient.calories_kcal != null ? ingredient.calories_kcal : '—'}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <Link
                      to={buildLocalizedPath(lang, `/admin/sastojci/${ingredient.slug}/izmeni`)}
                      aria-label={t('admin.ingredients.edit')}
                      className="flex size-8 items-center justify-center rounded-control border border-border text-muted-foreground hover:text-foreground"
                    >
                      <Pencil className="size-3.5" />
                    </Link>
                    <button
                      type="button"
                      onClick={() => setPendingDelete(ingredient)}
                      aria-label={t('admin.ingredients.delete')}
                      className="flex size-8 items-center justify-center rounded-control border border-border text-favorite hover:bg-favorite/10"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {!isLoading && visible.length === 0 && (
          <p className="px-4 py-6 text-center text-sm text-muted-foreground">{t('admin.ingredients.noResults')}</p>
        )}
      </div>

      <DeleteIngredientDialog
        ingredientName={pendingDelete ? pickLocalized(pendingDelete.name_en, pendingDelete.name_sr, lang) : null}
        isDeleting={isDeleting}
        error={deleteError}
        onConfirm={() => void handleConfirmDelete()}
        onOpenChange={(open) => !open && setPendingDelete(null)}
      />
    </div>
  )
}

export default AdminIngredientsPage
