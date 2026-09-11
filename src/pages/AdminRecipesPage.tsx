import { Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useAdminRecipes } from '@/hooks/useAdminRecipes'
import { useCurrentLang } from '@/hooks/useCurrentLang'
import { pickLocalized } from '@/lib/localizedField'
import { buildLocalizedPath } from '@/lib/localizedPath'

function AdminRecipesPage() {
  const { t } = useTranslation()
  const lang = useCurrentLang()
  const { recipes, isLoading } = useAdminRecipes()

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">
          {t('admin.nav.recipes')}
          {!isLoading && ` (${recipes.length})`}
        </h1>
        <Link
          to={buildLocalizedPath(lang, '/admin/recepti/novi')}
          className="flex items-center gap-1.5 rounded-control bg-accent px-3 py-2 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent-hover"
        >
          <Plus className="size-4" />
          {t('nav.addRecipe')}
        </Link>
      </div>

      <div className="flex flex-col divide-y divide-border rounded-card border border-border bg-surface">
        {recipes.map((recipe) => {
          const name = pickLocalized(recipe.name_en, recipe.name_sr, lang)
          const categoryName = recipe.category
            ? pickLocalized(recipe.category.name_en, recipe.category.name_sr, lang)
            : null

          return (
            <Link
              key={recipe.id}
              to={buildLocalizedPath(lang, `/admin/recepti/${recipe.slug}/izmeni`)}
              className="flex items-center justify-between px-4 py-3 text-sm transition-colors hover:bg-surface-hover"
            >
              <span className="font-medium text-foreground">{name}</span>
              {categoryName && <span className="text-muted-foreground">{categoryName}</span>}
            </Link>
          )
        })}
      </div>
    </div>
  )
}

export default AdminRecipesPage
