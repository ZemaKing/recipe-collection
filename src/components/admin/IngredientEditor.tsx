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

const EMPTY_INGREDIENT: AdminRecipeIngredient = {
  name_en: '',
  name_sr: '',
  quantity: '',
  unit_en: '',
  unit_sr: '',
  ingredient_id: '',
}

const inputClass =
  'rounded-control border border-border bg-surface-elevated px-2.5 py-1.5 text-sm text-foreground placeholder:text-muted-foreground'

function IngredientEditor({ value, onChange, errors }: IngredientEditorProps) {
  const { t } = useTranslation()
  const lang = useCurrentLang()
  const { ingredients } = useIngredients()
  const [openRow, setOpenRow] = useState<number | null>(null)

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
    setOpenRow(null)
  }

  return (
    <div className="flex flex-col gap-3">
      {value.map((row, index) => {
        const query = row.name_en.trim().toLowerCase()
        const suggestions =
          openRow === index && query.length > 0
            ? ingredients
                .filter(
                  (ingredient) =>
                    ingredient.name_en.toLowerCase().includes(query) ||
                    ingredient.name_sr?.toLowerCase().includes(query),
                )
                .slice(0, 6)
            : []
        const selectedIngredient = row.ingredient_id
          ? ingredients.find((ingredient) => ingredient.id === row.ingredient_id)
          : undefined

        return (
          <div key={index} className="flex flex-col gap-2 rounded-card border border-border bg-surface p-3">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
              <div className="relative sm:col-span-2">
                <input
                  value={row.name_en}
                  onChange={(e) => {
                    updateRow(index, { name_en: e.target.value, ingredient_id: '' })
                    setOpenRow(index)
                  }}
                  onFocus={() => setOpenRow(index)}
                  onBlur={() => setTimeout(() => setOpenRow((current) => (current === index ? null : current)), 150)}
                  placeholder={t('admin.recipeForm.ingredientNameEn')}
                  autoComplete="off"
                  className={`${inputClass} w-full`}
                />
                {errors?.[`ingredients.${index}.name_en`] && (
                  <p className="mt-1 text-xs text-favorite">{errors[`ingredients.${index}.name_en`]}</p>
                )}

                {suggestions.length > 0 && (
                  <ul className="absolute top-full left-0 z-20 mt-1 w-72 max-w-[80vw] overflow-hidden rounded-control border border-border bg-surface-elevated shadow-xl">
                    {suggestions.map((ingredient) => (
                      <li key={ingredient.id}>
                        <button
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => selectSuggestion(index, ingredient)}
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

                {openRow === index && query.length > 0 && suggestions.length === 0 && (
                  <div className="absolute top-full left-0 z-20 mt-1 w-72 max-w-[80vw] rounded-control border border-border bg-surface-elevated p-3 text-sm shadow-xl">
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

              <input
                value={row.name_sr}
                onChange={(e) => updateRow(index, { name_sr: e.target.value })}
                placeholder={t('admin.recipeForm.ingredientNameSr')}
                className={`${inputClass} sm:col-span-2`}
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
                className="flex size-7 items-center justify-center rounded-control border border-border text-muted-foreground hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ArrowUp className="size-3.5" />
              </button>
              <button
                type="button"
                onClick={() => moveRow(index, 1)}
                disabled={index === value.length - 1}
                aria-label={t('admin.recipeForm.moveDown')}
                className="flex size-7 items-center justify-center rounded-control border border-border text-muted-foreground hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ArrowDown className="size-3.5" />
              </button>
              <button
                type="button"
                onClick={() => removeRow(index)}
                aria-label={t('admin.recipeForm.remove')}
                className="flex size-7 items-center justify-center rounded-control border border-border text-favorite hover:bg-favorite/10"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          </div>
        )
      })}

      <button
        type="button"
        onClick={() => onChange([...value, { ...EMPTY_INGREDIENT }])}
        className="flex items-center justify-center gap-1.5 rounded-control border border-dashed border-border px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <Plus className="size-4" />
        {t('admin.recipeForm.addIngredient')}
      </button>
    </div>
  )
}

export default IngredientEditor
