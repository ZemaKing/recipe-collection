import { useState } from 'react'
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import type { AdminRecipeIngredient } from '@/hooks/useAdminRecipe'
import { useCurrentLang } from '@/hooks/useCurrentLang'
import { type IngredientWithCategory, useIngredients } from '@/hooks/useIngredients'
import { pickLocalized } from '@/lib/localizedField'
import { buildLocalizedPath } from '@/lib/localizedPath'
import { cn } from '@/lib/utils'

interface IngredientEditorProps {
  value: AdminRecipeIngredient[]
  onChange: (next: AdminRecipeIngredient[]) => void
  errors?: Record<string, string>
}

type NameField = 'en' | 'sr'

const inputClass =
  'rounded-control border border-border bg-surface-elevated px-2.5 py-1.5 text-sm text-foreground placeholder:text-muted-foreground'

interface IngredientNameFieldProps {
  value: string
  placeholder: string
  ingredients: IngredientWithCategory[]
  lang: ReturnType<typeof useCurrentLang>
  isOpen: boolean
  onOpen: () => void
  onClose: () => void
  onChange: (value: string) => void
  onSelect: (ingredient: IngredientWithCategory) => void
  error?: string
}

function IngredientNameField({
  value,
  placeholder,
  ingredients,
  lang,
  isOpen,
  onOpen,
  onClose,
  onChange,
  onSelect,
  error,
}: IngredientNameFieldProps) {
  const { t } = useTranslation()
  const query = value.trim().toLowerCase()
  const suggestions =
    isOpen && query.length > 0
      ? ingredients
          .filter(
            (ingredient) =>
              ingredient.name_en.toLowerCase().includes(query) ||
              ingredient.name_sr?.toLowerCase().includes(query),
          )
          .slice(0, 6)
      : []

  return (
    <div className="relative">
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={onOpen}
        onBlur={() => setTimeout(onClose, 150)}
        placeholder={placeholder}
        autoComplete="off"
        className={`${inputClass} w-full`}
      />
      {error && <p className="mt-1 text-xs text-favorite">{error}</p>}

      {suggestions.length > 0 && (
        <ul className="absolute top-full left-0 z-20 mt-1 w-64 max-w-[80vw] overflow-hidden rounded-control border border-border bg-surface-elevated shadow-xl">
          {suggestions.map((ingredient) => (
            <li key={ingredient.id}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => onSelect(ingredient)}
                className="flex w-full flex-col items-start px-3 py-2 text-left text-sm hover:bg-surface-hover"
              >
                <span className="font-medium text-foreground">
                  {pickLocalized(ingredient.name_en, ingredient.name_sr, lang)}
                </span>
                {ingredient.latin_name && (
                  <span className="text-xs text-muted-foreground italic">{ingredient.latin_name}</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}

      {isOpen && query.length > 0 && suggestions.length === 0 && (
        <div className="absolute top-full left-0 z-20 mt-1 w-64 max-w-[80vw] rounded-control border border-border bg-surface-elevated p-3 text-sm shadow-xl">
          <p className="text-muted-foreground">{t('admin.recipeForm.noCatalogMatch')}</p>
          <Link
            to={buildLocalizedPath(lang, '/admin/sastojci/novi')}
            className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-accent hover:text-accent-hover"
          >
            <Plus className="size-3.5" />
            {t('admin.recipeForm.addToCatalog')}
          </Link>
        </div>
      )}
    </div>
  )
}

function IngredientEditor({ value, onChange, errors }: IngredientEditorProps) {
  const { t } = useTranslation()
  const lang = useCurrentLang()
  const { ingredients } = useIngredients()
  const [openField, setOpenField] = useState<{ index: number; field: NameField } | null>(null)

  function updateRow(index: number, patch: Partial<AdminRecipeIngredient>) {
    onChange(value.map((row, i) => (i === index ? { ...row, ...patch } : row)))
  }

  function removeRow(index: number) {
    onChange(value.filter((_, i) => i !== index))
  }

  function moveRow(index: number, direction: -1 | 1) {
    const target = index + direction
    if (target < 0 || target >= value.length) return
    const next = [...value]
    ;[next[index], next[target]] = [next[target], next[index]]
    onChange(next)
  }

  function selectSuggestion(index: number, ingredient: IngredientWithCategory) {
    const row = value[index]
    updateRow(index, {
      name_en: ingredient.name_en,
      name_sr: ingredient.name_sr ?? '',
      unit_en: row.unit_en || (ingredient.default_unit_en ?? ''),
      unit_sr: row.unit_sr || (ingredient.default_unit_sr ?? ''),
      ingredient_id: ingredient.id,
    })
    setOpenField(null)
  }

  return (
    <div className="flex flex-col gap-3">
      {value.map((row, index) => {
        const selectedIngredient = row.ingredient_id
          ? ingredients.find((ingredient) => ingredient.id === row.ingredient_id)
          : undefined

        return (
          <div key={index} className="flex flex-col gap-2 rounded-card border border-border bg-surface p-3">
            <div className="grid grid-cols-3 gap-2">
              <IngredientNameField
                value={row.name_en}
                placeholder={t('admin.recipeForm.ingredientNameEn')}
                ingredients={ingredients}
                lang={lang}
                isOpen={openField?.index === index && openField.field === 'en'}
                onOpen={() => setOpenField({ index, field: 'en' })}
                onClose={() => setOpenField((cur) => (cur?.index === index && cur.field === 'en' ? null : cur))}
                onChange={(next) => {
                  updateRow(index, { name_en: next, ingredient_id: '' })
                  setOpenField({ index, field: 'en' })
                }}
                onSelect={(ingredient) => selectSuggestion(index, ingredient)}
                error={errors?.[`ingredients.${index}.name_en`]}
              />
              <IngredientNameField
                value={row.name_sr}
                placeholder={t('admin.recipeForm.ingredientNameSr')}
                ingredients={ingredients}
                lang={lang}
                isOpen={openField?.index === index && openField.field === 'sr'}
                onOpen={() => setOpenField({ index, field: 'sr' })}
                onClose={() => setOpenField((cur) => (cur?.index === index && cur.field === 'sr' ? null : cur))}
                onChange={(next) => {
                  updateRow(index, { name_sr: next, ingredient_id: '' })
                  setOpenField({ index, field: 'sr' })
                }}
                onSelect={(ingredient) => selectSuggestion(index, ingredient)}
              />
              <div>
                <input
                  value={row.quantity}
                  onChange={(e) => updateRow(index, { quantity: e.target.value })}
                  placeholder={t('admin.recipeForm.quantity')}
                  inputMode="decimal"
                  className={`${inputClass} w-full`}
                />
                {errors?.[`ingredients.${index}.quantity`] && (
                  <p className="mt-1 text-xs text-favorite">{errors[`ingredients.${index}.quantity`]}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <input
                value={row.unit_en}
                onChange={(e) => updateRow(index, { unit_en: e.target.value })}
                placeholder={t('admin.recipeForm.unitEn')}
                className={inputClass}
              />
              <input
                value={row.unit_sr}
                onChange={(e) => updateRow(index, { unit_sr: e.target.value })}
                placeholder={t('admin.recipeForm.unitSr')}
                className={inputClass}
              />
              <div />
            </div>

            {selectedIngredient && (
              <div className={cn('rounded-control bg-accent-soft px-3 py-2 text-xs text-accent')}>
                {selectedIngredient.default_unit_en && (
                  <p>
                    {t('admin.recipeForm.defaultUnit', { unit: selectedIngredient.default_unit_en })}
                  </p>
                )}
                {selectedIngredient.fact_en && (
                  <p className="mt-0.5">{pickLocalized(selectedIngredient.fact_en, selectedIngredient.fact_sr, lang)}</p>
                )}
              </div>
            )}

            <div className="flex items-center gap-1 self-end">
              <button
                type="button"
                onClick={() => moveRow(index, -1)}
                disabled={index === 0}
                aria-label={t('admin.recipeForm.moveUp')}
                className="flex size-7 items-center justify-center rounded-full border border-border text-muted-foreground hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ArrowUp className="size-3.5" />
              </button>
              <button
                type="button"
                onClick={() => moveRow(index, 1)}
                disabled={index === value.length - 1}
                aria-label={t('admin.recipeForm.moveDown')}
                className="flex size-7 items-center justify-center rounded-full border border-border text-muted-foreground hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ArrowDown className="size-3.5" />
              </button>
              <button
                type="button"
                onClick={() => removeRow(index)}
                aria-label={t('admin.recipeForm.remove')}
                className="flex size-7 items-center justify-center rounded-full border border-border text-favorite hover:bg-favorite/10"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default IngredientEditor
