import { FileX } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import IngredientForm from '@/components/admin/IngredientForm'
import EmptyState from '@/components/ui/EmptyState'
import { useAdminIngredient } from '@/hooks/useAdminIngredient'
import { useCurrentLang } from '@/hooks/useCurrentLang'
import { useSaveIngredient } from '@/hooks/useSaveIngredient'
import type { IngredientFormValues } from '@/lib/ingredientFormSchema'
import { EMPTY_INGREDIENT_FORM_STATE, type IngredientFormState } from '@/lib/ingredientFormState'
import { buildLocalizedPath } from '@/lib/localizedPath'

function AdminIngredientFormPage() {
  const { t } = useTranslation()
  const lang = useCurrentLang()
  const navigate = useNavigate()
  const { slug } = useParams<{ slug: string }>()
  const mode = slug ? 'edit' : 'create'

  const { ingredient, isLoading, notFound } = useAdminIngredient(slug)
  const { save, isSaving, error } = useSaveIngredient()

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

  const initialValues: IngredientFormState =
    mode === 'edit' && ingredient ? ingredient : EMPTY_INGREDIENT_FORM_STATE

  async function handleSubmit(values: IngredientFormValues) {
    const savedId = await save(mode === 'edit' && ingredient ? ingredient.id : null, values)
    if (!savedId) return
    navigate(buildLocalizedPath(lang, '/admin/sastojci'))
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">
        {mode === 'create' ? t('admin.ingredients.addIngredient') : t('admin.ingredients.editTitle')}
      </h1>

      <IngredientForm
        key={slug ?? 'create'}
        mode={mode}
        initialValues={initialValues}
        isSaving={isSaving}
        submitError={error}
        onSubmit={(values) => void handleSubmit(values)}
      />
    </div>
  )
}

export default AdminIngredientFormPage
