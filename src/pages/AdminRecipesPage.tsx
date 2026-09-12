import { useEffect, useState } from 'react'
import { ArrowUpDown, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import DeleteRecipeDialog from '@/components/admin/DeleteRecipeDialog'
import RecipeImage from '@/components/recipes/RecipeImage'
import { useAdminRecipes, type AdminRecipeListItem, type AdminRecipeSort } from '@/hooks/useAdminRecipes'
import { useCategories } from '@/hooks/useCategories'
import { useCurrentLang } from '@/hooks/useCurrentLang'
import { useDeleteRecipe } from '@/hooks/useDeleteRecipe'
import { getCategoryBadgeColor } from '@/lib/categoryColor'
import { pickLocalized } from '@/lib/localizedField'
import { buildLocalizedPath } from '@/lib/localizedPath'

const inputClass =
  'rounded-control border border-border bg-surface-elevated px-2.5 py-1.5 text-sm text-foreground placeholder:text-muted-foreground'

function AdminRecipesPage() {
  const { t } = useTranslation()
  const lang = useCurrentLang()

  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<AdminRecipeSort>('name')
  const [categoryId, setCategoryId] = useState('')
  const [page, setPage] = useState(0)
  const [pendingDelete, setPendingDelete] = useState<AdminRecipeListItem | null>(null)

  const { categories } = useCategories()

  // Debounce the search box so typing doesn't fire a query per keystroke.
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput)
      setPage(0)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchInput])

  const { recipes, total, isLoading, error, pageSize, refetch } = useAdminRecipes({
    search,
    sort,
    page,
    categoryId,
  })
  const { deleteRecipe, isDeleting, error: deleteError } = useDeleteRecipe()

  const pageCount = Math.max(1, Math.ceil(total / pageSize))

  async function handleConfirmDelete() {
    if (!pendingDelete) return
    await deleteRecipe(pendingDelete.id)
    setPendingDelete(null)
    refetch()
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">
          {t('admin.nav.recipes')}
          {!isLoading && ` (${total})`}
        </h1>
        <Link
          to={buildLocalizedPath(lang, '/admin/recepti/novi')}
          className="flex items-center gap-1.5 rounded-control bg-accent px-3 py-2 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent-hover"
        >
          <Plus className="size-4" />
          {t('nav.addRecipe')}
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder={t('admin.recipesList.searchPlaceholder')}
            className={`${inputClass} w-full pl-8`}
          />
        </div>
        <select
          value={categoryId}
          onChange={(e) => {
            setCategoryId(e.target.value)
            setPage(0)
          }}
          className={inputClass}
        >
          <option value="">{t('admin.recipesList.allCategories')}</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {pickLocalized(category.name_en, category.name_sr, lang)}
            </option>
          ))}
        </select>
        <select
          value={sort}
          onChange={(e) => {
            setSort(e.target.value as AdminRecipeSort)
            setPage(0)
          }}
          className={inputClass}
        >
          <option value="name">{t('admin.recipesList.sortName')}</option>
          <option value="rating">{t('admin.recipesList.sortRating')}</option>
          <option value="recent">{t('admin.recipesList.sortRecent')}</option>
        </select>
      </div>

      {error && <p className="text-sm text-favorite">{error}</p>}

      <div className="overflow-hidden rounded-card border border-border bg-surface">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs font-medium tracking-wide text-muted-foreground uppercase">
              <th className="w-16 px-4 py-3 font-medium">{t('admin.recipesList.columnImage')}</th>
              <th className="px-2 py-3 font-medium">
                <span className="inline-flex items-center gap-1.5">
                  {t('admin.recipesList.columnName')}
                  <ArrowUpDown className="size-3.5" />
                </span>
              </th>
              <th className="px-2 py-3 font-medium">{t('admin.recipesList.columnCategory')}</th>
              <th className="px-4 py-3 text-right font-medium">{t('admin.recipesList.columnActions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {recipes.map((recipe) => {
              const name = pickLocalized(recipe.name_en, recipe.name_sr, lang)
              const categoryName = recipe.category
                ? pickLocalized(recipe.category.name_en, recipe.category.name_sr, lang)
                : null
              const badgeColor = recipe.category ? getCategoryBadgeColor(recipe.category.slug) : null

              return (
                <tr key={recipe.id} className="transition-colors hover:bg-surface-hover">
                  <td className="px-4 py-2.5">
                    <RecipeImage
                      image={recipe.image}
                      alt={name}
                      className="aspect-[3/2] w-15 shrink-0 rounded-control"
                    />
                  </td>
                  <td className="px-2 py-2.5">
                    <Link
                      to={buildLocalizedPath(lang, `/admin/recepti/${recipe.slug}/izmeni`)}
                      className="font-medium text-foreground transition-colors hover:text-accent"
                    >
                      {name}
                    </Link>
                  </td>
                  <td className="px-2 py-2.5">
                    {categoryName && badgeColor && (
                      <span
                        className={`inline-flex items-center rounded-pill px-2.5 py-1 text-xs font-medium ${badgeColor.bg} ${badgeColor.text}`}
                      >
                        {categoryName}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        to={buildLocalizedPath(lang, `/admin/recepti/${recipe.slug}/izmeni`)}
                        aria-label={t('admin.recipesList.edit')}
                        className="flex size-8 shrink-0 items-center justify-center rounded-control border border-border text-muted-foreground hover:bg-surface-elevated hover:text-foreground"
                      >
                        <Pencil className="size-3.5" />
                      </Link>
                      <button
                        type="button"
                        onClick={() => setPendingDelete(recipe)}
                        aria-label={t('admin.recipesList.delete')}
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

        {!isLoading && recipes.length === 0 && (
          <p className="px-4 py-6 text-center text-sm text-muted-foreground">{t('admin.recipesList.noResults')}</p>
        )}
      </div>

      {pageCount > 1 && (
        <div className="flex items-center justify-center gap-3 text-sm">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="rounded-control border border-border px-3 py-1.5 font-medium text-foreground disabled:cursor-not-allowed disabled:opacity-40"
          >
            {t('admin.recipesList.previous')}
          </button>
          <span className="text-muted-foreground">
            {t('admin.recipesList.pageOf', { page: page + 1, pageCount })}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
            disabled={page >= pageCount - 1}
            className="rounded-control border border-border px-3 py-1.5 font-medium text-foreground disabled:cursor-not-allowed disabled:opacity-40"
          >
            {t('admin.recipesList.next')}
          </button>
        </div>
      )}

      <DeleteRecipeDialog
        recipeName={pendingDelete ? pickLocalized(pendingDelete.name_en, pendingDelete.name_sr, lang) : null}
        isDeleting={isDeleting}
        error={deleteError}
        onConfirm={() => void handleConfirmDelete()}
        onOpenChange={(open) => !open && setPendingDelete(null)}
      />
    </div>
  )
}

export default AdminRecipesPage
