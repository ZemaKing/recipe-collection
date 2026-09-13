import { useMemo, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import MicronutrientPickerSection from '@/components/admin/MicronutrientPickerSection'
import { useCurrentLang } from '@/hooks/useCurrentLang'
import { useIngredientCategories } from '@/hooks/useIngredientCategories'
import { useMinerals } from '@/hooks/useMinerals'
import { useVitamins } from '@/hooks/useVitamins'
import { pickLocalized } from '@/lib/localizedField'
import { ingredientFormSchema, type IngredientFormValues } from '@/lib/ingredientFormSchema'
import type { IngredientFormState } from '@/lib/ingredientFormState'
import { slugify } from '@/lib/slugify'

interface IngredientFormProps {
  mode: 'create' | 'edit'
  initialValues: IngredientFormState
  isSaving: boolean
  submitError: string | null
  onSubmit: (values: IngredientFormValues) => void
}

const inputClass =
  'rounded-control border border-border bg-surface-elevated px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground'
const labelClass = 'text-sm font-medium text-foreground'

function fieldErrorPath(path: PropertyKey[]): string {
  return path.map(String).join('.')
}

function IngredientForm({ mode, initialValues, isSaving, submitError, onSubmit }: IngredientFormProps) {
  const { t } = useTranslation()
  const lang = useCurrentLang()
  const { categories } = useIngredientCategories()
  const { vitamins: vitaminCatalog } = useVitamins()
  const { minerals: mineralCatalog } = useMinerals()

  const [form, setForm] = useState<IngredientFormState>(initialValues)
  const [slugTouched, setSlugTouched] = useState(mode === 'edit')
  const [errors, setErrors] = useState<Record<string, string>>({})

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
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {Object.keys(errors).length > 0 && (
        <p className="rounded-control border border-favorite/40 bg-favorite/10 px-3 py-2 text-sm text-favorite">
          {t('admin.recipeForm.formHasErrors')}
        </p>
      )}

      <section className="flex flex-col gap-3 rounded-card border border-border bg-surface p-4">
        <h2 className="text-sm font-semibold text-foreground">{t('admin.ingredients.namesSection')}</h2>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <label className={labelClass}>{t('admin.recipeForm.nameEn')}</label>
            <input value={form.name_en} onChange={(e) => handleNameEnChange(e.target.value)} className={inputClass} />
            {errorMessages.name_en && <p className="text-xs text-favorite">{errorMessages.name_en}</p>}
          </div>

          <div className="flex flex-col gap-1">
            <label className={labelClass}>{t('admin.recipeForm.nameSr')}</label>
            <input value={form.name_sr} onChange={(e) => update('name_sr', e.target.value)} className={inputClass} />
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
            <label className={labelClass}>{t('admin.ingredients.latinName')}</label>
            <input
              value={form.latin_name}
              onChange={(e) => update('latin_name', e.target.value)}
              className={inputClass}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className={labelClass}>{t('admin.ingredients.regionalNames')}</label>
            <input
              value={form.regional_names}
              onChange={(e) => update('regional_names', e.target.value)}
              className={inputClass}
            />
          </div>

          <div className="flex flex-col gap-1 sm:col-span-2">
            <label className={labelClass}>{t('admin.recipeForm.category')}</label>
            <select
              value={form.ingredient_category_id}
              onChange={(e) => update('ingredient_category_id', e.target.value)}
              className={inputClass}
            >
              <option value="">{t('browse.categoryAll')}</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {pickLocalized(category.name_en, category.name_sr, lang)}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className={labelClass}>{t('admin.ingredients.defaultUnitEn')}</label>
            <input
              value={form.default_unit_en}
              onChange={(e) => update('default_unit_en', e.target.value)}
              className={inputClass}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className={labelClass}>{t('admin.ingredients.defaultUnitSr')}</label>
            <input
              value={form.default_unit_sr}
              onChange={(e) => update('default_unit_sr', e.target.value)}
              className={inputClass}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className={labelClass}>{t('admin.ingredients.factEn')}</label>
            <textarea
              value={form.fact_en}
              onChange={(e) => update('fact_en', e.target.value)}
              rows={2}
              placeholder={t('admin.ingredients.factPlaceholder')}
              className={inputClass}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className={labelClass}>{t('admin.ingredients.factSr')}</label>
            <textarea
              value={form.fact_sr}
              onChange={(e) => update('fact_sr', e.target.value)}
              rows={2}
              placeholder={t('admin.ingredients.factPlaceholder')}
              className={inputClass}
            />
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-3 rounded-card border border-border bg-surface p-4">
        <h2 className="text-sm font-semibold text-foreground">{t('admin.ingredients.nutritionSection')}</h2>
        <p className="text-xs text-muted-foreground">{t('admin.ingredients.nutritionPer100g')}</p>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          <div className="flex flex-col gap-1">
            <label className={labelClass}>{t('recipeDetail.nutrition.calories')}</label>
            <input
              value={form.calories_kcal}
              onChange={(e) => update('calories_kcal', e.target.value)}
              inputMode="decimal"
              className={inputClass}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className={labelClass}>{t('recipeDetail.nutrition.protein')}</label>
            <input
              value={form.protein_g}
              onChange={(e) => update('protein_g', e.target.value)}
              inputMode="decimal"
              className={inputClass}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className={labelClass}>{t('recipeDetail.nutrition.fat')}</label>
            <input
              value={form.fat_g}
              onChange={(e) => update('fat_g', e.target.value)}
              inputMode="decimal"
              className={inputClass}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className={labelClass}>{t('recipeDetail.nutrition.carbs')}</label>
            <input
              value={form.carbs_g}
              onChange={(e) => update('carbs_g', e.target.value)}
              inputMode="decimal"
              className={inputClass}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className={labelClass}>{t('recipeDetail.nutrition.fiber')}</label>
            <input
              value={form.fiber_g}
              onChange={(e) => update('fiber_g', e.target.value)}
              inputMode="decimal"
              className={inputClass}
            />
          </div>
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

        <div className="flex flex-col gap-2">
          <span className={labelClass}>{t('admin.ingredients.unitConversions')}</span>
          <p className="text-xs text-muted-foreground">{t('admin.ingredients.unitConversionsHelp')}</p>
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
            ? t('admin.ingredients.createSubmit')
            : t('admin.recipeForm.editSubmit')}
      </button>
    </form>
  )
}

export default IngredientForm
