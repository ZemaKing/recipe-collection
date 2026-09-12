import { useMemo, useState } from 'react'
import { ChevronDown, Clock, Gauge, ImageOff, Plus, Users } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import ImageManager from '@/components/admin/ImageManager'
import IngredientEditor from '@/components/admin/IngredientEditor'
import StepEditor from '@/components/admin/StepEditor'
import type { AdminRecipeIngredient, AdminRecipeStep } from '@/hooks/useAdminRecipe'
import { useCategories } from '@/hooks/useCategories'
import { useCurrentLang } from '@/hooks/useCurrentLang'
import { useTags } from '@/hooks/useTags'
import { pickLocalized } from '@/lib/localizedField'
import { difficultyValues, recipeFormSchema, type RecipeFormValues } from '@/lib/recipeFormSchema'
import { EMPTY_INGREDIENT, type RecipeFormState } from '@/lib/recipeFormState'
import { slugify } from '@/lib/slugify'
import { cn } from '@/lib/utils'

interface RecipeFormProps {
  formId: string
  mode: 'create' | 'edit'
  recipeId: string | null
  initialValues: RecipeFormState
  submitError: string | null
  onSubmit: (values: RecipeFormValues) => void
}

const inputClass =
  'rounded-control border border-border bg-surface-elevated px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground'
const labelClass = 'text-sm font-medium text-foreground'

const DIFFICULTY_ICON_COLOR: Record<string, string> = {
  easy: 'text-emerald-400',
  medium: 'text-amber-400',
  hard: 'text-rose-400',
}

function fieldErrorPath(path: PropertyKey[]): string {
  return path.map(String).join('.')
}

function FormCard({
  title,
  action,
  children,
}: {
  title: string
  action?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section className="overflow-hidden rounded-card border border-border bg-surface">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        {action}
      </div>
      <div className="flex flex-col gap-3 p-4">{children}</div>
    </section>
  )
}

function AddButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-1.5 rounded-control bg-accent px-3 py-1.5 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent-hover"
    >
      <Plus className="size-4" />
      {label}
    </button>
  )
}

function IconNumberField({
  icon: Icon,
  iconClassName,
  value,
  onChange,
  suffix,
  disabled,
}: {
  icon: LucideIcon
  iconClassName?: string
  value: string
  onChange?: (value: string) => void
  suffix?: string
  disabled?: boolean
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-control border border-border bg-surface-elevated px-2.5 py-2',
        disabled && 'opacity-60',
      )}
    >
      <Icon className={cn('size-4 shrink-0 text-muted-foreground', iconClassName)} />
      <input
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        disabled={disabled}
        inputMode="numeric"
        className="w-full min-w-0 bg-transparent text-sm text-foreground outline-none disabled:cursor-not-allowed"
      />
      {suffix && <span className="shrink-0 text-xs text-muted-foreground">{suffix}</span>}
    </div>
  )
}

function IconSelectField({
  icon: Icon,
  iconClassName,
  value,
  onChange,
  children,
}: {
  icon: LucideIcon
  iconClassName?: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void
  children: React.ReactNode
}) {
  return (
    <div className="relative flex items-center gap-2 rounded-control border border-border bg-surface-elevated px-2.5 py-2">
      <Icon className={cn('size-4 shrink-0', iconClassName)} />
      <select
        value={value}
        onChange={onChange}
        className="w-full appearance-none bg-transparent pr-4 text-sm text-foreground outline-none"
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 size-3.5 text-muted-foreground" />
    </div>
  )
}

function RecipeForm({ formId, mode, recipeId, initialValues, submitError, onSubmit }: RecipeFormProps) {
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

  const totalTimeMinutes = useMemo(() => {
    const prep = Number(form.prep_time_minutes)
    const cook = Number(form.cook_time_minutes)
    const total = (Number.isFinite(prep) ? prep : 0) + (Number.isFinite(cook) ? cook : 0)
    return total > 0 ? String(total) : ''
  }, [form.prep_time_minutes, form.cook_time_minutes])

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
    <form id={formId} onSubmit={handleSubmit} className="flex flex-col gap-4">
      {Object.keys(errors).length > 0 && (
        <p className="rounded-control border border-favorite/40 bg-favorite/10 px-3 py-2 text-sm text-favorite">
          {t('admin.recipeForm.formHasErrors')}
        </p>
      )}
      {submitError && <p className="text-sm text-favorite">{submitError}</p>}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          <FormCard title={t('admin.recipeForm.basics')}>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1">
                <label className={labelClass}>{t('admin.recipeForm.nameSr')}</label>
                <input
                  value={form.name_sr}
                  onChange={(e) => update('name_sr', e.target.value)}
                  className={inputClass}
                />
              </div>

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
                <label className={labelClass}>{t('admin.recipeForm.descriptionSr')}</label>
                <textarea
                  value={form.description_sr}
                  onChange={(e) => update('description_sr', e.target.value)}
                  rows={2}
                  className={inputClass}
                />
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
            </div>
          </FormCard>

          <FormCard title={t('admin.recipeForm.images')}>
            {recipeId ? (
              <ImageManager recipeId={recipeId} />
            ) : (
              <div className="flex items-center gap-2 rounded-card border border-dashed border-border p-4 text-sm text-muted-foreground">
                <ImageOff className="size-4 shrink-0" />
                {t('admin.recipeForm.imagesNeedSave')}
              </div>
            )}
          </FormCard>

          <FormCard
            title={t('recipeDetail.ingredients.title')}
            action={
              <AddButton
                label={t('admin.recipeForm.addIngredient')}
                onClick={() => update('ingredients', [...form.ingredients, { ...EMPTY_INGREDIENT }])}
              />
            }
          >
            <IngredientEditor
              value={form.ingredients}
              onChange={(ingredients: AdminRecipeIngredient[]) => update('ingredients', ingredients)}
              errors={errorMessages}
            />
            {errorMessages.ingredients && <p className="text-xs text-favorite">{errorMessages.ingredients}</p>}
          </FormCard>

          <FormCard
            title={t('recipeDetail.steps.title')}
            action={
              <AddButton
                label={t('admin.recipeForm.addStep')}
                onClick={() => update('steps', [...form.steps, { text_en: '', text_sr: '' }])}
              />
            }
          >
            <StepEditor
              value={form.steps}
              onChange={(steps: AdminRecipeStep[]) => update('steps', steps)}
              errors={errorMessages}
            />
            {errorMessages.steps && <p className="text-xs text-favorite">{errorMessages.steps}</p>}
          </FormCard>
        </div>

        <div className="flex flex-col gap-4">
          <FormCard title={t('admin.recipeForm.categorySection')}>
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
          </FormCard>

          <FormCard title={t('admin.recipeForm.timeAndDifficulty')}>
            <div className="grid grid-cols-3 gap-3">
              <div className="flex flex-col gap-1">
                <label className={labelClass}>{t('recipeDetail.meta.prepTime')}</label>
                <IconNumberField
                  icon={Clock}
                  value={form.prep_time_minutes}
                  onChange={(v) => update('prep_time_minutes', v)}
                  suffix="min"
                />
                {errorMessages.prep_time_minutes && (
                  <p className="text-xs text-favorite">{errorMessages.prep_time_minutes}</p>
                )}
              </div>

              <div className="flex flex-col gap-1">
                <label className={labelClass}>{t('recipeDetail.meta.cookTime')}</label>
                <IconNumberField
                  icon={Clock}
                  value={form.cook_time_minutes}
                  onChange={(v) => update('cook_time_minutes', v)}
                  suffix="min"
                />
                {errorMessages.cook_time_minutes && (
                  <p className="text-xs text-favorite">{errorMessages.cook_time_minutes}</p>
                )}
              </div>

              <div className="flex flex-col gap-1">
                <label className={labelClass}>{t('admin.recipeForm.totalTime')}</label>
                <IconNumberField icon={Clock} value={totalTimeMinutes} suffix="min" disabled />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className={labelClass}>{t('recipeDetail.meta.servings')}</label>
                <IconNumberField
                  icon={Users}
                  value={form.servings}
                  onChange={(v) => update('servings', v)}
                />
                {errorMessages.servings && <p className="text-xs text-favorite">{errorMessages.servings}</p>}
              </div>

              <div className="flex flex-col gap-1">
                <label className={labelClass}>{t('admin.recipeForm.difficulty')}</label>
                <IconSelectField
                  icon={Gauge}
                  iconClassName={DIFFICULTY_ICON_COLOR[form.difficulty] ?? 'text-muted-foreground'}
                  value={form.difficulty}
                  onChange={(e) => update('difficulty', e.target.value as RecipeFormState['difficulty'])}
                >
                  <option value="">—</option>
                  {difficultyValues.map((value) => (
                    <option key={value} value={value}>
                      {t(`recipeDetail.difficulty.${value}`)}
                    </option>
                  ))}
                </IconSelectField>
              </div>
            </div>
          </FormCard>

          <FormCard title={t('admin.recipeForm.additionalOptions')}>
            {tags.length > 0 && (
              <div className="flex flex-col gap-2">
                {tags.map((tag) => (
                  <label key={tag.id} className="flex items-center gap-2 text-sm text-foreground">
                    <input
                      type="checkbox"
                      checked={form.tagIds.includes(tag.id)}
                      onChange={() => toggleTag(tag.id)}
                      className="size-4 rounded border-border accent-accent"
                    />
                    {pickLocalized(tag.name_en, tag.name_sr, lang)}
                  </label>
                ))}
              </div>
            )}

            <div className="flex flex-col gap-1">
              <label className={labelClass}>{t('admin.recipeForm.notesSr')}</label>
              <textarea
                value={form.tips_sr}
                onChange={(e) => update('tips_sr', e.target.value)}
                rows={3}
                placeholder={t('admin.recipeForm.tipsSrPlaceholder')}
                className={inputClass}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className={labelClass}>{t('admin.recipeForm.notesEn')}</label>
              <textarea
                value={form.tips_en}
                onChange={(e) => update('tips_en', e.target.value)}
                rows={3}
                placeholder={t('admin.recipeForm.tipsEnPlaceholder')}
                className={inputClass}
              />
            </div>
          </FormCard>
        </div>
      </div>
    </form>
  )
}

export default RecipeForm
