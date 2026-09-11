import { FileX } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import ImageManager from '@/components/admin/ImageManager'
import RecipeForm from '@/components/admin/RecipeForm'
import EmptyState from '@/components/ui/EmptyState'
import { useAdminRecipe } from '@/hooks/useAdminRecipe'
import { useCurrentLang } from '@/hooks/useCurrentLang'
import { useSaveRecipe } from '@/hooks/useSaveRecipe'
import { buildLocalizedPath } from '@/lib/localizedPath'
import type { RecipeFormValues } from '@/lib/recipeFormSchema'
import { EMPTY_RECIPE_FORM_STATE, type RecipeFormState } from '@/lib/recipeFormState'

function AdminRecipeFormPage() {
  const { t } = useTranslation()
  const lang = useCurrentLang()
  const navigate = useNavigate()
  const { slug } = useParams<{ slug: string }>()
  const mode = slug ? 'edit' : 'create'

  const { recipe, isLoading, notFound } = useAdminRecipe(slug)
  const { save, isSaving, error } = useSaveRecipe()

  if (mode === 'edit' && isLoading) return null

  if (mode === 'edit' && notFound) {
    return (
      <EmptyState
        icon={FileX}
        title={t('recipeDetail.notFoundTitle')}
        description={t('recipeDetail.notFoundDescription')}
      />
    )
  }

  const initialValues: RecipeFormState =
    mode === 'edit' && recipe
      ? {
          slug: recipe.slug,
          name_en: recipe.name_en,
          name_sr: recipe.name_sr,
          description_en: recipe.description_en,
          description_sr: recipe.description_sr,
          tips_en: recipe.tips_en,
          tips_sr: recipe.tips_sr,
          category_id: recipe.category_id,
          prep_time_minutes: recipe.prep_time_minutes,
          cook_time_minutes: recipe.cook_time_minutes,
          servings: recipe.servings,
          weight_grams: recipe.weight_grams,
          difficulty: recipe.difficulty,
          rating: recipe.rating,
          tagIds: recipe.tagIds,
          ingredients: recipe.ingredients,
          steps: recipe.steps,
        }
      : EMPTY_RECIPE_FORM_STATE

  async function handleSubmit(values: RecipeFormValues) {
    const savedId = await save(mode === 'edit' && recipe ? recipe.id : null, values)
    if (!savedId) return

    if (mode === 'create') {
      // Images require an existing recipe_id, so hop straight to the edit
      // page for the new recipe instead of the list.
      navigate(buildLocalizedPath(lang, `/admin/recepti/${values.slug}/izmeni`))
    } else {
      navigate(buildLocalizedPath(lang, '/admin/recepti'))
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">
        {mode === 'create' ? t('pages.addRecipe') : t('admin.recipeForm.editTitle')}
      </h1>

      <RecipeForm
        key={slug ?? 'create'}
        mode={mode}
        initialValues={initialValues}
        isSaving={isSaving}
        submitError={error}
        onSubmit={(values) => void handleSubmit(values)}
      />

      {mode === 'edit' && recipe && (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-foreground">{t('admin.recipeForm.images')}</h2>
          <ImageManager recipeId={recipe.id} />
        </section>
      )}
    </div>
  )
}

export default AdminRecipeFormPage
