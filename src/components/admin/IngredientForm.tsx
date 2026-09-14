import { forwardRef, useImperativeHandle, useMemo, useState } from 'react'
import { BarChart3, FileText, Image as ImageIcon, ImageOff, LayoutGrid, Lightbulb, Plus, Scale, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import FormCard, { RequiredMark } from '@/components/admin/FormCard'
import ImportIngredientJsonDialog from '@/components/admin/ImportIngredientJsonDialog'
import IngredientCategoryPicker from '@/components/admin/IngredientCategoryPicker'
import IngredientImageManager from '@/components/admin/IngredientImageManager'
import MicronutrientPickerSection from '@/components/admin/MicronutrientPickerSection'
import { useCurrentLang } from '@/hooks/useCurrentLang'
import { useIngredientCategories } from '@/hooks/useIngredientCategories'
import { useMinerals } from '@/hooks/useMinerals'
import { useVitamins } from '@/hooks/useVitamins'
import { buildAiIngredientPrompt } from '@/lib/aiIngredientPrompt'
import { copyToClipboard } from '@/lib/clipboard'
import { ingredientFormSchema, type IngredientFormValues } from '@/lib/ingredientFormSchema'
import type { IngredientFormState } from '@/lib/ingredientFormState'
import { slugify } from '@/lib/slugify'

interface IngredientFormProps {
  formId: string
  mode: 'create' | 'edit'
  ingredientId: string | null
  initialValues: IngredientFormState
  submitError: string | null
  onSubmit: (values: IngredientFormValues) => void
}

export interface IngredientFormHandle {
  openImportDialog: () => void
  copyAiPrompt: () => Promise<void>
}

const inputClass =
  'rounded-control border border-border bg-surface-elevated px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground'
const labelClass = 'text-sm font-medium text-foreground'

function fieldErrorPath(path: PropertyKey[]): string {
  return path.map(String).join('.')
}

function SuffixNumberField({
  label,
  value,
  onChange,
  suffix,
  placeholder,
  error,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  suffix: string
  placeholder?: string
  error?: string
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className={labelClass}>{label}</label>
      <div className="flex items-center gap-2 rounded-control border border-border bg-surface-elevated px-3 py-2">
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          inputMode="decimal"
          placeholder={placeholder}
          className="w-full min-w-0 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
        />
        <span className="shrink-0 text-xs text-muted-foreground">{suffix}</span>
      </div>
      {error && <p className="text-xs text-favorite">{error}</p>}
    </div>
  )
}

const IngredientForm = forwardRef<IngredientFormHandle, IngredientFormProps>(function IngredientForm(
  { formId, mode, ingredientId, initialValues, submitError, onSubmit },
  ref,
) {
  const { t } = useTranslation()
  const lang = useCurrentLang()
  const { categories } = useIngredientCategories()
  const { vitamins: vitaminCatalog } = useVitamins()
  const { minerals: mineralCatalog } = useMinerals()

  const [form, setForm] = useState<IngredientFormState>(initialValues)
  const [slugTouched, setSlugTouched] = useState(mode === 'edit')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isImportOpen, setIsImportOpen] = useState(false)

  useImperativeHandle(ref, () => ({
    openImportDialog: () => setIsImportOpen(true),
    copyAiPrompt: async () => {
      const prompt = buildAiIngredientPrompt({
        lang,
        categories,
        vitamins: vitaminCatalog,
        minerals: mineralCatalog,
        nameSr: form.name_sr,
        nameEn: form.name_en,
      })
      await copyToClipboard(prompt)
    },
  }))

  const vitaminsById = useMemo(() => new Map(vitaminCatalog.map((v) => [v.id, v])), [vitaminCatalog])
  const mineralsById = useMemo(() => new Map(mineralCatalog.map((m) => [m.id, m])), [mineralCatalog])
  const availableVitamins = useMemo(
    () => vitaminCatalog.filter((v) => !form.vitamins.some((r) => r.vitamin_id === v.id)),
    [vitaminCatalog, form.vitamins],
  )
  const availableMinerals = useMemo(
    () => mineralCatalog.filter((m) => !form.minerals.some((r) => r.mineral_id === m.id)),
    [mineralCatalog, form.minerals],
  )

  function update<K extends keyof IngredientFormState>(key: K, value: IngredientFormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function handleNameEnChange(value: string) {
    update('name_en', value)
    if (!slugTouched) update('slug', slugify(value))
  }

  function handleImport(imported: IngredientFormState) {
    setForm(imported)
    setSlugTouched(true)
    setErrors({})
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

    // Drop rows the admin added but never filled in (e.g. clicked "+" by
    // mistake) rather than treating them as validation errors. Rebuild the
    // form state itself (not just a local copy) so the rendered rows and
    // the validated/error indices stay in sync with each other.
    const nextForm: IngredientFormState = {
      ...form,
      unitConversions: form.unitConversions.filter((row) => row.unit || row.grams),
    }
    if (nextForm.unitConversions.length !== form.unitConversions.length) {
      setForm(nextForm)
    }

    const result = ingredientFormSchema.safeParse(nextForm)

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

  function addVitaminRow(vitaminId: string) {
    update('vitamins', [...form.vitamins, { vitamin_id: vitaminId, amount: '' }])
  }

  function updateVitaminRow(index: number, amount: string) {
    update(
      'vitamins',
      form.vitamins.map((row, i) => (i === index ? { ...row, amount } : row)),
    )
  }

  function removeVitaminRow(index: number) {
    update(
      'vitamins',
      form.vitamins.filter((_, i) => i !== index),
    )
  }

  function addMineralRow(mineralId: string) {
    update('minerals', [...form.minerals, { mineral_id: mineralId, amount: '' }])
  }

  function updateMineralRow(index: number, amount: string) {
    update(
      'minerals',
      form.minerals.map((row, i) => (i === index ? { ...row, amount } : row)),
    )
  }

  function removeMineralRow(index: number) {
    update(
      'minerals',
      form.minerals.filter((_, i) => i !== index),
    )
  }

  function addUnitConversionRow() {
    update('unitConversions', [...form.unitConversions, { unit: '', grams: '' }])
  }

  function updateUnitConversionRow(index: number, patch: Partial<IngredientFormState['unitConversions'][number]>) {
    update(
      'unitConversions',
      form.unitConversions.map((row, i) => (i === index ? { ...row, ...patch } : row)),
    )
  }

  function removeUnitConversionRow(index: number) {
    update(
      'unitConversions',
      form.unitConversions.filter((_, i) => i !== index),
    )
  }

  return (
    <>
      <form id={formId} onSubmit={handleSubmit} className="flex flex-col gap-4">
        {Object.keys(errors).length > 0 && (
          <p className="rounded-control border border-favorite/40 bg-favorite/10 px-3 py-2 text-sm text-favorite">
            {t('admin.recipeForm.formHasErrors')}
          </p>
        )}

        <FormCard icon={FileText} title={t('admin.ingredients.namesSection')} description={t('admin.ingredients.namesSectionSubtitle')}>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <label className={labelClass}>{t('admin.recipeForm.nameSr')}</label>
              <input
                value={form.name_sr}
                onChange={(e) => update('name_sr', e.target.value)}
                placeholder={t('admin.ingredients.nameSrPlaceholder')}
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
                placeholder={t('admin.ingredients.nameEnPlaceholder')}
                className={inputClass}
              />
              {errorMessages.name_en && <p className="text-xs text-favorite">{errorMessages.name_en}</p>}
            </div>

            <div className="flex flex-col gap-1 sm:col-span-2">
              <label className={labelClass}>{t('admin.recipeForm.slug')}</label>
              <input
                value={form.slug}
                onChange={(e) => {
                  setSlugTouched(true)
                  update('slug', e.target.value)
                }}
                placeholder={t('admin.ingredients.slugPlaceholder')}
                className={inputClass}
              />
              <p className="text-xs text-muted-foreground">{t('admin.ingredients.slugHint')}</p>
              {errorMessages.slug && <p className="text-xs text-favorite">{errorMessages.slug}</p>}
            </div>

            <div className="flex flex-col gap-1">
              <label className={labelClass}>{t('admin.ingredients.latinName')}</label>
              <input
                value={form.latin_name}
                onChange={(e) => update('latin_name', e.target.value)}
                placeholder={t('admin.ingredients.latinNamePlaceholder')}
                className={inputClass}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className={labelClass}>{t('admin.ingredients.regionalNames')}</label>
              <input
                value={form.regional_names}
                onChange={(e) => update('regional_names', e.target.value)}
                placeholder={t('admin.ingredients.regionalNamesPlaceholder')}
                className={inputClass}
              />
            </div>
          </div>
        </FormCard>

        <FormCard icon={ImageIcon} title={t('admin.ingredients.imagesSection')} description={t('admin.ingredients.imagesSectionSubtitle')}>
          {ingredientId ? (
            <IngredientImageManager ingredientId={ingredientId} />
          ) : (
            <div className="flex items-center gap-2 rounded-card border border-dashed border-border p-4 text-sm text-muted-foreground">
              <ImageOff className="size-4 shrink-0" />
              {t('admin.ingredients.imagesNeedSave')}
            </div>
          )}
        </FormCard>

        <FormCard icon={LayoutGrid} title={t('admin.ingredients.categorySection')} description={t('admin.ingredients.categorySectionSubtitle')}>
          <IngredientCategoryPicker
            categories={categories}
            value={form.ingredient_category_id}
            onChange={(categoryId) => update('ingredient_category_id', categoryId)}
          />
        </FormCard>

        <FormCard icon={Lightbulb} title={t('admin.ingredients.factSection')} description={t('admin.ingredients.factSectionSubtitle')}>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <label className={labelClass}>{t('admin.ingredients.factSr')}</label>
              <textarea
                value={form.fact_sr}
                onChange={(e) => update('fact_sr', e.target.value)}
                rows={2}
                maxLength={300}
                placeholder={t('admin.ingredients.factSrPlaceholder')}
                className={inputClass}
              />
              <p className="self-end text-xs text-muted-foreground">{form.fact_sr.length}/300</p>
              {errorMessages.fact_sr && <p className="text-xs text-favorite">{errorMessages.fact_sr}</p>}
            </div>

            <div className="flex flex-col gap-1">
              <label className={labelClass}>{t('admin.ingredients.factEn')}</label>
              <textarea
                value={form.fact_en}
                onChange={(e) => update('fact_en', e.target.value)}
                rows={2}
                maxLength={300}
                placeholder={t('admin.ingredients.factEnPlaceholder')}
                className={inputClass}
              />
              <p className="self-end text-xs text-muted-foreground">{form.fact_en.length}/300</p>
              {errorMessages.fact_en && <p className="text-xs text-favorite">{errorMessages.fact_en}</p>}
            </div>
          </div>
        </FormCard>

        <FormCard icon={BarChart3} title={t('admin.ingredients.nutritionSection')} description={t('admin.ingredients.nutritionPer100g')}>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            <SuffixNumberField
              label={t('recipeDetail.nutrition.calories')}
              value={form.calories_kcal}
              onChange={(v) => update('calories_kcal', v)}
              suffix="kcal"
              placeholder={t('admin.ingredients.caloriesPlaceholder')}
              error={errorMessages.calories_kcal}
            />
            <SuffixNumberField
              label={t('recipeDetail.nutrition.protein')}
              value={form.protein_g}
              onChange={(v) => update('protein_g', v)}
              suffix="g"
              placeholder={t('admin.ingredients.proteinPlaceholder')}
              error={errorMessages.protein_g}
            />
            <SuffixNumberField
              label={t('recipeDetail.nutrition.fat')}
              value={form.fat_g}
              onChange={(v) => update('fat_g', v)}
              suffix="g"
              placeholder={t('admin.ingredients.fatPlaceholder')}
              error={errorMessages.fat_g}
            />
            <SuffixNumberField
              label={t('recipeDetail.nutrition.carbs')}
              value={form.carbs_g}
              onChange={(v) => update('carbs_g', v)}
              suffix="g"
              placeholder={t('admin.ingredients.carbsPlaceholder')}
              error={errorMessages.carbs_g}
            />
            <SuffixNumberField
              label={t('recipeDetail.nutrition.fiber')}
              value={form.fiber_g}
              onChange={(v) => update('fiber_g', v)}
              suffix="g"
              placeholder={t('admin.ingredients.fiberPlaceholder')}
              error={errorMessages.fiber_g}
            />
          </div>

          <MicronutrientPickerSection
            label={t('admin.ingredients.vitaminsSection')}
            addPlaceholder={t('admin.ingredients.addVitaminPlaceholder')}
            catalog={availableVitamins}
            entriesById={vitaminsById}
            rows={form.vitamins.map((r) => ({ id: r.vitamin_id, amount: r.amount }))}
            lang={lang}
            errorFor={(i) => errorMessages[`vitamins.${i}.amount`] ?? errorMessages[`vitamins.${i}.vitamin_id`]}
            onAdd={addVitaminRow}
            onChangeAmount={updateVitaminRow}
            onRemove={removeVitaminRow}
          />

          <MicronutrientPickerSection
            label={t('admin.ingredients.mineralsSection')}
            addPlaceholder={t('admin.ingredients.addMineralPlaceholder')}
            catalog={availableMinerals}
            entriesById={mineralsById}
            rows={form.minerals.map((r) => ({ id: r.mineral_id, amount: r.amount }))}
            lang={lang}
            errorFor={(i) => errorMessages[`minerals.${i}.amount`] ?? errorMessages[`minerals.${i}.mineral_id`]}
            onAdd={addMineralRow}
            onChangeAmount={updateMineralRow}
            onRemove={removeMineralRow}
          />
        </FormCard>

        <FormCard icon={Scale} title={t('admin.ingredients.unitsSection')} description={t('admin.ingredients.unitConversionsHelp')}>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <label className={labelClass}>{t('admin.ingredients.defaultUnitSr')}</label>
              <input
                value={form.default_unit_sr}
                onChange={(e) => update('default_unit_sr', e.target.value)}
                placeholder={t('admin.ingredients.defaultUnitPlaceholder')}
                className={inputClass}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className={labelClass}>{t('admin.ingredients.defaultUnitEn')}</label>
              <input
                value={form.default_unit_en}
                onChange={(e) => update('default_unit_en', e.target.value)}
                placeholder={t('admin.ingredients.defaultUnitPlaceholder')}
                className={inputClass}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <span className={labelClass}>{t('admin.ingredients.unitConversions')}</span>
            {form.unitConversions.map((row, index) => (
              <div key={index} className="grid grid-cols-[1fr_auto_auto] items-start gap-2">
                <div>
                  <input
                    value={row.unit}
                    onChange={(e) => updateUnitConversionRow(index, { unit: e.target.value })}
                    placeholder={t('admin.ingredients.unit')}
                    className={`${inputClass} w-full`}
                  />
                  {errorMessages[`unitConversions.${index}.unit`] && (
                    <p className="mt-1 text-xs text-favorite">{errorMessages[`unitConversions.${index}.unit`]}</p>
                  )}
                </div>
                <div>
                  <input
                    value={row.grams}
                    onChange={(e) => updateUnitConversionRow(index, { grams: e.target.value })}
                    placeholder={t('admin.ingredients.grams')}
                    inputMode="decimal"
                    className={`${inputClass} w-24`}
                  />
                  {errorMessages[`unitConversions.${index}.grams`] && (
                    <p className="mt-1 text-xs text-favorite">{errorMessages[`unitConversions.${index}.grams`]}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => removeUnitConversionRow(index)}
                  aria-label={t('admin.recipeForm.remove')}
                  className="flex size-9 items-center justify-center rounded-control border border-border text-favorite hover:bg-favorite/10"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addUnitConversionRow}
              className="flex items-center justify-center gap-1.5 rounded-control border border-dashed border-border px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              <Plus className="size-4" />
              {t('admin.ingredients.addUnitConversion')}
            </button>
          </div>
        </FormCard>

        {submitError && <p className="text-sm text-favorite">{submitError}</p>}
      </form>

      <ImportIngredientJsonDialog
        open={isImportOpen}
        onOpenChange={setIsImportOpen}
        categories={categories}
        vitamins={vitaminCatalog}
        minerals={mineralCatalog}
        onImport={handleImport}
      />
    </>
  )
})

export default IngredientForm
