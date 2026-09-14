import { useRef, useState } from 'react'
import { ArrowLeft, Check, FileText, FileX, Upload } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useParams } from 'react-router-dom'
import IngredientForm, { type IngredientFormHandle } from '@/components/admin/IngredientForm'
import EmptyState from '@/components/ui/EmptyState'
import { useAdminIngredient } from '@/hooks/useAdminIngredient'
import { useCurrentLang } from '@/hooks/useCurrentLang'
import { useSaveIngredient } from '@/hooks/useSaveIngredient'
import type { IngredientFormValues } from '@/lib/ingredientFormSchema'
import { EMPTY_INGREDIENT_FORM_STATE, type IngredientFormState } from '@/lib/ingredientFormState'
import { buildLocalizedPath } from '@/lib/localizedPath'

const INGREDIENT_FORM_ID = 'ingredient-form'

function AdminIngredientFormPage() {
  const { t } = useTranslation()
  const lang = useCurrentLang()
  const navigate = useNavigate()
  const { slug } = useParams<{ slug: string }>()
  const mode = slug ? 'edit' : 'create'

  const { ingredient, isLoading, notFound } = useAdminIngredient(slug)
  const { save, isSaving, error } = useSaveIngredient()
  const formRef = useRef<IngredientFormHandle>(null)
  const [promptCopied, setPromptCopied] = useState(false)

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

    if (mode === 'create') {
      // The image card needs an existing ingredient id, so hop straight to
      // the edit page for the new ingredient instead of the list.
      navigate(buildLocalizedPath(lang, `/admin/sastojci/${values.slug}/izmeni`))
    } else {
      navigate(buildLocalizedPath(lang, '/admin/sastojci'))
    }
  }

  async function handleCopyAiPrompt() {
    await formRef.current?.copyAiPrompt()
    setPromptCopied(true)
    setTimeout(() => setPromptCopied(false), 2000)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Link
              to={buildLocalizedPath(lang, '/admin/sastojci')}
              aria-label={t('admin.ingredients.backToList')}
              className="flex size-9 items-center justify-center rounded-control border border-border text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="size-4" />
            </Link>
            <h1 className="text-xl font-semibold">
              {mode === 'create' ? t('admin.ingredients.addIngredient') : t('admin.ingredients.editTitle')}
            </h1>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{t('admin.ingredients.formSubtitle')}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void handleCopyAiPrompt()}
            className="flex items-center gap-1.5 rounded-control border border-border px-3 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-surface-hover"
          >
            {promptCopied ? <Check className="size-4 text-emerald-400" /> : <FileText className="size-4" />}
            {promptCopied ? t('admin.recipeForm.copyAiPromptCopied') : t('admin.recipeForm.copyAiPrompt')}
          </button>
          <button
            type="button"
            onClick={() => formRef.current?.openImportDialog()}
            className="flex items-center gap-1.5 rounded-control border border-border px-3 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-surface-hover"
          >
            <Upload className="size-4" />
            {t('admin.recipeForm.importJson')}
          </button>
          <Link
            to={buildLocalizedPath(lang, '/admin/sastojci')}
            className="rounded-control border border-border px-3 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-surface-hover"
          >
            {t('admin.recipeForm.cancel')}
          </Link>
          <button
            type="submit"
            form={INGREDIENT_FORM_ID}
            disabled={isSaving}
            className="rounded-control bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving
              ? t('admin.recipeForm.saving')
              : mode === 'create'
                ? t('admin.ingredients.createSubmit')
                : t('admin.recipeForm.editSubmit')}
          </button>
        </div>
      </div>

      <IngredientForm
        key={slug ?? 'create'}
        ref={formRef}
        formId={INGREDIENT_FORM_ID}
        mode={mode}
        ingredientId={mode === 'edit' && ingredient ? ingredient.id : null}
        initialValues={initialValues}
        submitError={error}
        onSubmit={(values) => void handleSubmit(values)}
      />
    </div>
  )
}

export default AdminIngredientFormPage
