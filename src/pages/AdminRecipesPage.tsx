import { useEffect, useState } from 'react'
import { Plus, Search, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import DeleteRecipeDialog from '@/components/admin/DeleteRecipeDialog'
import { useAdminRecipes, type AdminRecipeListItem, type AdminRecipeSort } from '@/hooks/useAdminRecipes'
import { useCurrentLang } from '@/hooks/useCurrentLang'
import { useDeleteRecipe } from '@/hooks/useDeleteRecipe'
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
  const [page, setPage] = useState(0)
  const [pendingDelete, setPendingDelete] = useState<AdminRecipeListItem | null>(null)

  // Debounce the search box so typing doesn't fire a query per keystroke.
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput)
      setPage(0)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchInput])

  const { recipes, total, isLoading, error, pageSize, refetch } = useAdminRecipes({ search, sort, page })
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

      <div className="flex flex-col divide-y divide-border rounded-card border border-border bg-surface">
        {recipes.map((recipe) => {
          const name = pickLocalized(recipe.name_en, recipe.name_sr, lang)
          const categoryName = recipe.category
            ? pickLocalized(recipe.category.name_en, recipe.category.name_sr, lang)
            : null

          return (
            <div key={recipe.id} className="flex items-center gap-2 px-4 py-3 text-sm">
              <Link
                to={buildLocalizedPath(lang, `/admin/recepti/${recipe.slug}/izmeni`)}
                className="flex flex-1 items-center justify-between gap-2 transition-colors hover:text-accent"
              >
                <span className="font-medium text-foreground">{name}</span>
                {categoryName && <span className="text-muted-foreground">{categoryName}</span>}
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
          )
        })}

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
