import { useMemo, useState } from 'react'
import { ArrowDown, ArrowUp, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import DeleteIngredientDialog from '@/components/admin/DeleteIngredientDialog'
import IngredientCategoryFilter from '@/components/admin/IngredientCategoryFilter'
import IngredientImage from '@/components/admin/IngredientImage'
import ViewModeToggle, { type ViewMode } from '@/components/admin/ViewModeToggle'
import { useCurrentLang } from '@/hooks/useCurrentLang'
import { useDeleteIngredient } from '@/hooks/useDeleteIngredient'
import { useIngredientCategories } from '@/hooks/useIngredientCategories'
import { type IngredientWithCategory, useIngredients } from '@/hooks/useIngredients'
import { getIngredientCategoryColors } from '@/lib/ingredientCategoryIcons'
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
  const [nameSortDirection, setNameSortDirection] = useState<'asc' | 'desc'>('asc')
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [pendingDelete, setPendingDelete] = useState<IngredientWithCategory | null>(null)

  const visible = useMemo(() => {
    const query = search.trim().toLowerCase()
    const filtered = ingredients.filter((ingredient) => {
      if (categoryFilter && ingredient.ingredient_category_id !== categoryFilter) return false
      if (!query) return true
      return (
        ingredient.name_en.toLowerCase().includes(query) ||
        (ingredient.name_sr?.toLowerCase().includes(query) ?? false)
      )
    })

    // Sorts by whichever language is active in the UI rather than a fixed
    // column, so switching languages re-sorts the list accordingly.
    const direction = nameSortDirection === 'asc' ? 1 : -1
    return [...filtered].sort(
      (a, b) => pickLocalized(a.name_en, a.name_sr, lang).localeCompare(pickLocalized(b.name_en, b.name_sr, lang)) * direction,
    )
  }, [ingredients, search, categoryFilter, nameSortDirection, lang])

  function handleNameHeaderClick() {
    setNameSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))
  }

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
        <IngredientCategoryFilter
          categories={categories}
          value={categoryFilter}
          onChange={setCategoryFilter}
          lang={lang}
          allLabel={t('admin.ingredients.allCategories')}
        />
        <ViewModeToggle value={viewMode} onChange={setViewMode} />
      </div>

      {viewMode === 'list' && (
        <div className="overflow-hidden rounded-card border border-border bg-surface">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs font-medium tracking-wide text-muted-foreground uppercase">
                <th className="w-16 px-4 py-3 font-medium">{t('admin.ingredients.columnImage')}</th>
                <th className="px-2 py-3 font-medium">
                  <button
                    type="button"
                    onClick={handleNameHeaderClick}
                    className="inline-flex items-center gap-1.5 uppercase text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {t('admin.ingredients.columnName')}
                    {nameSortDirection === 'asc' ? (
                      <ArrowUp className="size-3.5" />
                    ) : (
                      <ArrowDown className="size-3.5" />
                    )}
                  </button>
                </th>
                <th className="px-2 py-3 font-medium">{t('admin.ingredients.columnCategory')}</th>
                <th className="px-4 py-3 text-right font-medium">{t('admin.ingredients.columnActions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {visible.map((ingredient) => {
                const name = pickLocalized(ingredient.name_en, ingredient.name_sr, lang)
                const categoryName = ingredient.ingredient_category
                  ? pickLocalized(ingredient.ingredient_category.name_en, ingredient.ingredient_category.name_sr, lang)
                  : null
                const badgeColor = ingredient.ingredient_category
                  ? getIngredientCategoryColors(ingredient.ingredient_category.slug)
                  : null
                const editHref = buildLocalizedPath(lang, `/admin/sastojci/${ingredient.slug}/izmeni`)

                return (
                  <tr key={ingredient.id} className="transition-colors hover:bg-surface-hover">
                    <td className="px-4 py-2.5">
                      <Link to={editHref}>
                        <IngredientImage
                          storagePath={ingredient.image_storage_path}
                          alt={name}
                          className="aspect-[3/2] w-15 shrink-0 rounded-control"
                        />
                      </Link>
                    </td>
                    <td className="px-2 py-2.5">
                      <Link to={editHref} className="font-medium text-foreground transition-colors hover:text-accent">
                        {name}
                      </Link>
                    </td>
                    <td className="px-2 py-2.5">
                      {categoryName && badgeColor && (
                        <span
                          className={`inline-flex items-center rounded-pill px-2.5 py-1 text-xs font-medium ${badgeColor.bgSoft} ${badgeColor.text}`}
                        >
                          {categoryName}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={editHref}
                          aria-label={t('admin.ingredients.edit')}
                          className="flex size-8 shrink-0 items-center justify-center rounded-control border border-border text-muted-foreground hover:bg-surface-elevated hover:text-foreground"
                        >
                          <Pencil className="size-3.5" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => setPendingDelete(ingredient)}
                          aria-label={t('admin.ingredients.delete')}
                          className="flex size-8 shrink-0 items-center justify-center rounded-control border border-border text-favorite hover:bg-favorite/10"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {!isLoading && visible.length === 0 && (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">{t('admin.ingredients.noResults')}</p>
          )}
        </div>
      )}

      {viewMode === 'grid' && (
        <div className="rounded-card border border-border bg-surface p-4">
          <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-3">
            {visible.map((ingredient) => {
              const name = pickLocalized(ingredient.name_en, ingredient.name_sr, lang)
              const categoryName = ingredient.ingredient_category
                ? pickLocalized(ingredient.ingredient_category.name_en, ingredient.ingredient_category.name_sr, lang)
                : null
              const badgeColor = ingredient.ingredient_category
                ? getIngredientCategoryColors(ingredient.ingredient_category.slug)
                : null
              const editHref = buildLocalizedPath(lang, `/admin/sastojci/${ingredient.slug}/izmeni`)

              return (
                <div
                  key={ingredient.id}
                  className="flex flex-col overflow-hidden rounded-card border border-border bg-surface-elevated transition-colors hover:border-accent/50"
                >
                  <Link to={editHref}>
                    <IngredientImage storagePath={ingredient.image_storage_path} alt={name} className="aspect-[3/2] w-full" />
                  </Link>
                  <div className="flex flex-1 flex-col gap-2 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        to={editHref}
                        className="line-clamp-2 min-w-0 text-sm font-medium text-foreground transition-colors hover:text-accent"
                      >
                        {name}
                      </Link>
                      <div className="flex shrink-0 items-center gap-1">
                        <Link
                          to={editHref}
                          aria-label={t('admin.ingredients.edit')}
                          className="flex size-7 shrink-0 items-center justify-center rounded-control border border-border text-muted-foreground hover:bg-surface hover:text-foreground"
                        >
                          <Pencil className="size-3.5" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => setPendingDelete(ingredient)}
                          aria-label={t('admin.ingredients.delete')}
                          className="flex size-7 shrink-0 items-center justify-center rounded-control border border-border text-favorite hover:bg-favorite/10"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </div>
                    {categoryName && badgeColor && (
                      <span
                        className={`mt-auto block w-fit max-w-full truncate rounded-pill px-2 py-0.5 text-xs font-medium ${badgeColor.bgSoft} ${badgeColor.text}`}
                      >
                        {categoryName}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {!isLoading && visible.length === 0 && (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">{t('admin.ingredients.noResults')}</p>
          )}
        </div>
      )}

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
