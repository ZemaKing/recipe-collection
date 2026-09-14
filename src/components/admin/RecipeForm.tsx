import { forwardRef, useImperativeHandle, useMemo, useState } from 'react'
import {
  Carrot,
  Clock,
  ClipboardList,
  FileText,
  Image as ImageIcon,
  ImageOff,
  LayoutGrid,
  NotebookPen,
  Plus,
  Star,
  Users,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import CategorySelect from '@/components/admin/CategorySelect'
import DifficultySelect from '@/components/admin/DifficultySelect'
import FormCard, { RequiredMark } from '@/components/admin/FormCard'
import ImageManager from '@/components/admin/ImageManager'
import ImportRecipeJsonDialog from '@/components/admin/ImportRecipeJsonDialog'
import IngredientEditor from '@/components/admin/IngredientEditor'
import StepEditor from '@/components/admin/StepEditor'
import SubcategorySelect from '@/components/admin/SubcategorySelect'
import type { AdminRecipeIngredient, AdminRecipeStep } from '@/hooks/useAdminRecipe'
import { useCategories } from '@/hooks/useCategories'
import { useCurrentLang } from '@/hooks/useCurrentLang'
import { useIngredients } from '@/hooks/useIngredients'
import { useSubcategories } from '@/hooks/useSubcategories'
import { useTags } from '@/hooks/useTags'
import { buildAiRecipePrompt } from '@/lib/aiRecipePrompt'
import { copyToClipboard } from '@/lib/clipboard'
import { pickLocalized } from '@/lib/localizedField'
import { recipeFormSchema, type RecipeFormValues } from '@/lib/recipeFormSchema'
import type { RecipeFormState } from '@/lib/recipeFormState'
import { slugify } from '@/lib/slugify'
import { getTagColors, getTagIcon } from '@/lib/tagIcons'
import { cn } from '@/lib/utils'

interface RecipeFormProps {
  formId: string
  mode: 'create' | 'edit'
  recipeId: string | null
  initialValues: RecipeFormState
  submitError: string | null
  onSubmit: (values: RecipeFormValues) => void
}

export interface RecipeFormHandle {
  openImportDialog: () => void
  copyAiPrompt: () => Promise<void>
}

const inputClass =
  'rounded-control border border-border bg-surface-elevated px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground'
const labelClass = 'text-sm font-medium text-foreground'

function fieldErrorPath(path: PropertyKey[]): string {
  return path.map(String).join('.')
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

function StarRating({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const numericValue = Number(value) || 0
  return (
    <div className="flex items-center gap-1 rounded-control border border-border bg-surface-elevated px-3 py-2">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= Math.round(numericValue)
        return (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star === numericValue ? '0' : String(star))}
            aria-label={String(star)}
            className="text-muted-foreground transition-colors hover:text-accent"
          >
            <Star className={cn('size-5', filled && 'fill-accent text-accent')} />
          </button>
        )
      })}
    </div>
  )
}

function IconNumberField({
  icon: Icon,
  iconClassName,
  value,
  onChange,
  suffix,
  disabled,
  placeholder,
}: {
  icon: LucideIcon
  iconClassName?: string
  value: string
  onChange?: (value: string) => void
  suffix?: string
  disabled?: boolean
  placeholder?: string
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
        placeholder={placeholder}
        inputMode="numeric"
        className="w-full min-w-0 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed"
      />
      {suffix && <span className="shrink-0 text-xs text-muted-foreground">{suffix}</span>}
    </div>
  )
}

const RecipeForm = forwardRef<RecipeFormHandle, RecipeFormProps>(function RecipeForm(
  { formId, mode, recipeId, initialValues, submitError, onSubmit },
  ref,
) {
  const { t } = useTranslation()
  const lang = useCurrentLang()
  const { categories } = useCategories()
  const { subcategories } = useSubcategories()
  const { tags } = useTags()
  const { ingredients } = useIngredients()

  const [form, setForm] = useState<RecipeFormState>(initialValues)
  const [slugTouched, setSlugTouched] = useState(mode === 'edit')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isImportOpen, setIsImportOpen] = useState(false)

  useImperativeHandle(ref, () => ({
    openImportDialog: () => setIsImportOpen(true),
    copyAiPrompt: async () => {
      const prompt = buildAiRecipePrompt({
        lang,
        categories,
        subcategories,
        tags,
        nameSr: form.name_sr,
        nameEn: form.name_en,
      })
      await copyToClipboard(prompt)
    },
  }))

  const availableSubcategories = useMemo(
    () => subcategories.filter((subcategory) => subcategory.category_id === form.category_id),
    [subcategories, form.category_id],
  )

  function update<K extends keyof RecipeFormState>(key: K, value: RecipeFormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function handleCategoryChange(categoryId: string) {
    setForm((prev) => ({ ...prev, category_id: categoryId, subcategory_id: '' }))
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

  function handleImport(imported: RecipeFormState) {
    setForm(imported)
    setSlugTouched(true)
    setErrors({})
  }

  return (
    <>
    <form id={formId} onSubmit={handleSubmit} className="flex flex-col gap-4">
      {Object.keys(errors).length > 0 && (
        <p className="rounded-control border border-favorite/40 bg-favorite/10 px-3 py-2 text-sm text-favorite">
          {t('admin.recipeForm.formHasErrors')}
        </p>
      )}
      {submitError && <p className="text-sm text-favorite">{submitError}</p>}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div className="flex flex-col gap-4 lg:col-span-3">
          <FormCard icon={FileText} title={t('admin.recipeForm.basics')} description={t('admin.recipeForm.basicsSubtitle')}>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1">
                <label className={labelClass}>{t('admin.recipeForm.nameSr')}</label>
                <input
                  value={form.name_sr}
                  onChange={(e) => update('name_sr', e.target.value)}
                  placeholder={t('admin.recipeForm.nameSrPlaceholder')}
                  className={inputClass}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className={labelClass}>
                  {t('admin.recipeForm.nameEn')}
                  <RequiredMark />
                </label>
                <input
                  value={form.name_en}
                  onChange={(e) => handleNameEnChange(e.target.value)}
                  placeholder={t('admin.recipeForm.nameEnPlaceholder')}
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
                  placeholder={t('admin.recipeForm.descriptionSrPlaceholder')}
                  className={inputClass}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className={labelClass}>{t('admin.recipeForm.descriptionEn')}</label>
                <textarea
                  value={form.description_en}
                  onChange={(e) => update('description_en', e.target.value)}
                  rows={2}
                  placeholder={t('admin.recipeForm.descriptionEnPlaceholder')}
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
                  placeholder={t('admin.recipeForm.slugPlaceholder')}
                  className={inputClass}
                />
                <p className="text-xs text-muted-foreground">{t('admin.recipeForm.slugHint')}</p>
                {errorMessages.slug && <p className="text-xs text-favorite">{errorMessages.slug}</p>}
              </div>

              <div className="flex flex-col gap-1">
                <label className={labelClass}>{t('admin.recipeForm.rating')}</label>
                <StarRating value={form.rating} onChange={(v) => update('rating', v)} />
                {errorMessages.rating && <p className="text-xs text-favorite">{errorMessages.rating}</p>}
              </div>

              <div className="flex flex-col gap-1">
                <label className={labelClass}>{t('recipeDetail.meta.weight')}</label>
                <div className="flex items-center gap-2 rounded-control border border-border bg-surface-elevated px-3 py-2">
                  <input
                    value={form.weight_grams}
                    onChange={(e) => update('weight_grams', e.target.value)}
                    inputMode="numeric"
                    placeholder="0"
                    className="w-full min-w-0 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
                  />
                  <span className="shrink-0 text-xs text-muted-foreground">g</span>
                </div>
                {errorMessages.weight_grams && (
                  <p className="text-xs text-favorite">{errorMessages.weight_grams}</p>
                )}
              </div>
            </div>
          </FormCard>

          <FormCard icon={ImageIcon} title={t('admin.recipeForm.images')} description={t('admin.recipeForm.imagesSubtitle')}>
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
            icon={Carrot}
            title={t('recipeDetail.ingredients.title')}
            description={t('admin.recipeForm.ingredientsSubtitle')}
          >
            <IngredientEditor
              value={form.ingredients}
              onChange={(ingredients: AdminRecipeIngredient[]) => update('ingredients', ingredients)}
              errors={errorMessages}
            />
            {errorMessages.ingredients && <p className="text-xs text-favorite">{errorMessages.ingredients}</p>}
          </FormCard>

          <FormCard
            icon={ClipboardList}
            title={t('recipeDetail.steps.title')}
            description={t('admin.recipeForm.stepsSubtitle')}
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

        <div className="flex flex-col gap-4 lg:col-span-2">
          <FormCard
            icon={LayoutGrid}
            title={t('admin.recipeForm.categorySection')}
            description={t('admin.recipeForm.categorySectionSubtitle')}
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1">
                <label className={labelClass} htmlFor="recipe-category-select">
                  {t('admin.recipeForm.category')}
                  <RequiredMark />
                </label>
                <CategorySelect
                  inputId="recipe-category-select"
                  categories={categories}
                  value={form.category_id}
                  onChange={handleCategoryChange}
                  hasError={!!errorMessages.category_id}
                  placeholder={t('admin.recipeForm.categoryPlaceholder')}
                />
                {errorMessages.category_id && <p className="text-xs text-favorite">{errorMessages.category_id}</p>}
              </div>

              <div className="flex flex-col gap-1">
                <label className={labelClass} htmlFor="recipe-subcategory-select">
                  {t('admin.recipeForm.subcategory')}
                </label>
                <SubcategorySelect
                  inputId="recipe-subcategory-select"
                  subcategories={availableSubcategories}
                  value={form.subcategory_id}
                  onChange={(subcategoryId) => update('subcategory_id', subcategoryId)}
                  isDisabled={!form.category_id}
                  placeholder={t('admin.recipeForm.subcategoryPlaceholder')}
                />
              </div>
            </div>

            {tags.length > 0 && (
              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>{t('admin.recipeForm.tags')}</label>
                <p className="text-xs text-muted-foreground">{t('admin.recipeForm.tagsSubtitle')}</p>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => {
                    const Icon = getTagIcon(tag.slug)
                    const colors = getTagColors(tag.slug)
                    const active = form.tagIds.includes(tag.id)
                    return (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => toggleTag(tag.id)}
                        className={cn(
                          'flex items-center gap-1.5 rounded-pill border px-3 py-1.5 text-sm font-medium transition-colors',
                          active
                            ? cn(colors.border, colors.bgSoft, colors.text)
                            : 'border-border text-muted-foreground hover:text-foreground',
                        )}
                      >
                        <Icon className={cn('size-3.5', active && colors.text)} />
                        {pickLocalized(tag.name_en, tag.name_sr, lang)}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </FormCard>

          <FormCard
            icon={Clock}
            title={t('admin.recipeForm.timeAndDifficulty')}
            description={t('admin.recipeForm.timeAndDifficultySubtitle')}
          >
            <div className="grid grid-cols-3 gap-3">
              <div className="flex flex-col gap-1">
                <label className={labelClass}>{t('recipeDetail.meta.prepTime')}</label>
                <IconNumberField
                  icon={Clock}
                  value={form.prep_time_minutes}
                  onChange={(v) => update('prep_time_minutes', v)}
                  suffix="min"
                  placeholder="0"
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
                  placeholder="0"
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
                  placeholder="0"
                />
                {errorMessages.servings && <p className="text-xs text-favorite">{errorMessages.servings}</p>}
              </div>

              <div className="flex flex-col gap-1">
                <label className={labelClass}>{t('admin.recipeForm.difficulty')}</label>
                <DifficultySelect
                  value={form.difficulty}
                  onChange={(value) => update('difficulty', value as RecipeFormState['difficulty'])}
                  placeholder="—"
                />
              </div>
            </div>
          </FormCard>

          <FormCard icon={NotebookPen} title={t('admin.recipeForm.notes')} description={t('admin.recipeForm.notesSubtitle')}>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
            </div>
          </FormCard>
        </div>
      </div>
    </form>

    <ImportRecipeJsonDialog
      open={isImportOpen}
      onOpenChange={setIsImportOpen}
      categories={categories}
      subcategories={subcategories}
      tags={tags}
      ingredients={ingredients}
      onImport={handleImport}
    />
    </>
  )
})

export default RecipeForm
