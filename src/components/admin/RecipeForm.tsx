import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import IngredientEditor from '@/components/admin/IngredientEditor'
import StepEditor from '@/components/admin/StepEditor'
import type { AdminRecipeIngredient, AdminRecipeStep } from '@/hooks/useAdminRecipe'
import { useCategories } from '@/hooks/useCategories'
import { useCurrentLang } from '@/hooks/useCurrentLang'
import { useTags } from '@/hooks/useTags'
import { pickLocalized } from '@/lib/localizedField'
import { difficultyValues, recipeFormSchema, type RecipeFormValues } from '@/lib/recipeFormSchema'
import type { RecipeFormState } from '@/lib/recipeFormState'
import { slugify } from '@/lib/slugify'

interface RecipeFormProps {
  mode: 'create' | 'edit'
  initialValues: RecipeFormState
  isSaving: boolean
  submitError: string | null
  onSubmit: (values: RecipeFormValues) => void
}

const inputClass =
  'rounded-control border border-border bg-surface-elevated px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground'
const labelClass = 'text-sm font-medium text-foreground'

function fieldErrorPath(path: PropertyKey[]): string {
  return path.map(String).join('.')
}

function RecipeForm({ mode, initialValues, isSaving, submitError, onSubmit }: RecipeFormProps) {
  const { t } = useTranslation()
  const lang = useCurrentLang()
  const { categories } = useCategories()
  const { tags } = useTags()

  const [form, setForm] = useState<RecipeFormState>(initialValues)
  const [slugTouched, setSlugTouched] = useState(mode === 'edit')
  const [errors, setErrors] = useState<Record<string, string>>({})

  function update<K extends keyof RecipeFormState>(key: K, value: RecipeFormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function handleNameEnChange(value: string) {
    update('name_en', value)
    if (!slugTouched) update('slug', slugify(value))
  }

  function toggleTag(tagId: string) {
    setForm((prev) => ({
      ...prev,
      tagIds: prev.tagIds.includes(tagId) ? prev.tagIds.filter((id) => id !== tagId) : [...prev.tagIds, tagId],
    }))
  }

  const errorMessages = useMemo(() => {
    const map: Record<string, string> = {}
    for (const [path, key] of Object.entries(errors)) {
      map[path] = t(key)
    }
    return map
  }, [errors, t])

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    const result = recipeFormSchema.safeParse(form)

    if (!result.success) {
      const nextErrors: Record<string, string> = {}
      for (const issue of result.error.issues) {
        nextErrors[fieldErrorPath(issue.path)] = issue.message
      }
      setErrors(nextErrors)
      return
    }

    setErrors({})
    onSubmit(result.data)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {Object.keys(errors).length > 0 && (
        <p className="rounded-control border border-favorite/40 bg-favorite/10 px-3 py-2 text-sm text-favorite">
          {t('admin.recipeForm.formHasErrors')}
        </p>
      )}

      <section className="flex flex-col gap-3 rounded-card border border-border bg-surface p-4">
        <h2 className="text-sm font-semibold text-foreground">{t('admin.recipeForm.basics')}</h2>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <label className={labelClass}>{t('admin.recipeForm.nameEn')}</label>
            <input
              value={form.name_en}
              onChange={(e) => handleNameEnChange(e.target.value)}
              className={inputClass}
            />
            {errorMessages.name_en && <p className="text-xs text-favorite">{errorMessages.name_en}</p>}
          </div>

          <div className="flex flex-col gap-1">
            <label className={labelClass}>{t('admin.recipeForm.nameSr')}</label>
            <input
              value={form.name_sr}
              onChange={(e) => update('name_sr', e.target.value)}
              className={inputClass}
            />
          </div>

          <div className="flex flex-col gap-1 sm:col-span-2">
            <label className={labelClass}>{t('admin.recipeForm.slug')}</label>
            <input
              value={form.slug}
              onChange={(e) => {
                setSlugTouched(true)
                update('slug', e.target.value)
              }}
              className={inputClass}
            />
            {errorMessages.slug && <p className="text-xs text-favorite">{errorMessages.slug}</p>}
          </div>

          <div className="flex flex-col gap-1">
            <label className={labelClass}>{t('admin.recipeForm.descriptionEn')}</label>
            <textarea
              value={form.description_en}
              onChange={(e) => update('description_en', e.target.value)}
              rows={2}
              className={inputClass}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className={labelClass}>{t('admin.recipeForm.descriptionSr')}</label>
            <textarea
              value={form.description_sr}
              onChange={(e) => update('description_sr', e.target.value)}
              rows={2}
              className={inputClass}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className={labelClass}>{t('admin.recipeForm.category')}</label>
            <select
              value={form.category_id}
              onChange={(e) => update('category_id', e.target.value)}
              className={inputClass}
            >
              <option value="">{t('browse.categoryAll')}</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {pickLocalized(category.name_en, category.name_sr, lang)}
                </option>
              ))}
            </select>
            {errorMessages.category_id && <p className="text-xs text-favorite">{errorMessages.category_id}</p>}
          </div>

          <div className="flex flex-col gap-1">
            <label className={labelClass}>{t('admin.recipeForm.difficulty')}</label>
            <select
              value={form.difficulty}
              onChange={(e) => update('difficulty', e.target.value as RecipeFormState['difficulty'])}
              className={inputClass}
            >
              <option value="">—</option>
              {difficultyValues.map((value) => (
                <option key={value} value={value}>
                  {t(`recipeDetail.difficulty.${value}`)}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className={labelClass}>{t('recipeDetail.meta.prepTime')}</label>
            <input
              value={form.prep_time_minutes}
              onChange={(e) => update('prep_time_minutes', e.target.value)}
              inputMode="numeric"
              className={inputClass}
            />
            {errorMessages.prep_time_minutes && (
              <p className="text-xs text-favorite">{errorMessages.prep_time_minutes}</p>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <label className={labelClass}>{t('recipeDetail.meta.cookTime')}</label>
            <input
              value={form.cook_time_minutes}
              onChange={(e) => update('cook_time_minutes', e.target.value)}
              inputMode="numeric"
              className={inputClass}
            />
            {errorMessages.cook_time_minutes && (
              <p className="text-xs text-favorite">{errorMessages.cook_time_minutes}</p>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <label className={labelClass}>{t('recipeDetail.meta.servings')}</label>
            <input
              value={form.servings}
              onChange={(e) => update('servings', e.target.value)}
              inputMode="numeric"
              className={inputClass}
            />
            {errorMessages.servings && <p className="text-xs text-favorite">{errorMessages.servings}</p>}
          </div>

          <div className="flex flex-col gap-1">
            <label className={labelClass}>{t('recipeDetail.meta.weight')}</label>
            <input
              value={form.weight_grams}
              onChange={(e) => update('weight_grams', e.target.value)}
              inputMode="numeric"
              className={inputClass}
            />
            {errorMessages.weight_grams && (
              <p className="text-xs text-favorite">{errorMessages.weight_grams}</p>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <label className={labelClass}>{t('admin.recipeForm.rating')}</label>
            <input
              value={form.rating}
              onChange={(e) => update('rating', e.target.value)}
              inputMode="decimal"
              className={inputClass}
            />
            {errorMessages.rating && <p className="text-xs text-favorite">{errorMessages.rating}</p>}
          </div>

          <div className="flex flex-col gap-1">
            <label className={labelClass}>{t('recipeDetail.tips.tips')}</label>
            <textarea
              value={form.tips_en}
              onChange={(e) => update('tips_en', e.target.value)}
              rows={2}
              placeholder={t('admin.recipeForm.tipsEnPlaceholder')}
              className={inputClass}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className={labelClass}>&nbsp;</label>
            <textarea
              value={form.tips_sr}
              onChange={(e) => update('tips_sr', e.target.value)}
              rows={2}
              placeholder={t('admin.recipeForm.tipsSrPlaceholder')}
              className={inputClass}
            />
          </div>
        </div>

        {tags.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <span className={labelClass}>{t('browse.quickFilters')}</span>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <label
                  key={tag.id}
                  className="flex items-center gap-1.5 rounded-pill border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground"
                >
                  <input
                    type="checkbox"
                    checked={form.tagIds.includes(tag.id)}
                    onChange={() => toggleTag(tag.id)}
                    className="size-3.5 rounded border-border accent-accent"
                  />
                  {pickLocalized(tag.name_en, tag.name_sr, lang)}
                </label>
              ))}
            </div>
          </div>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-foreground">{t('recipeDetail.ingredients.title')}</h2>
        <IngredientEditor
          value={form.ingredients}
          onChange={(ingredients: AdminRecipeIngredient[]) => update('ingredients', ingredients)}
          errors={errorMessages}
        />
        {errorMessages.ingredients && <p className="text-xs text-favorite">{errorMessages.ingredients}</p>}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-foreground">{t('recipeDetail.steps.title')}</h2>
        <StepEditor
          value={form.steps}
          onChange={(steps: AdminRecipeStep[]) => update('steps', steps)}
          errors={errorMessages}
        />
        {errorMessages.steps && <p className="text-xs text-favorite">{errorMessages.steps}</p>}
      </section>

      {submitError && <p className="text-sm text-favorite">{submitError}</p>}

      <button
        type="submit"
        disabled={isSaving}
        className="self-start rounded-control bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSaving
          ? t('admin.recipeForm.saving')
          : mode === 'create'
            ? t('admin.recipeForm.createSubmit')
            : t('admin.recipeForm.editSubmit')}
      </button>
    </form>
  )
}

export default RecipeForm
