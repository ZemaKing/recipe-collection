import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { AdminRecipeIngredient } from '@/hooks/useAdminRecipe'

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
}

const inputClass =
  'rounded-control border border-border bg-surface-elevated px-2.5 py-1.5 text-sm text-foreground placeholder:text-muted-foreground'

function IngredientEditor({ value, onChange, errors }: IngredientEditorProps) {
  const { t } = useTranslation()

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

  return (
    <div className="flex flex-col gap-3">
      {value.map((row, index) => (
        <div key={index} className="flex flex-col gap-2 rounded-card border border-border bg-surface p-3">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            <div className="sm:col-span-2">
              <input
                value={row.name_en}
                onChange={(e) => updateRow(index, { name_en: e.target.value })}
                placeholder={t('admin.recipeForm.ingredientNameEn')}
                className={`${inputClass} w-full`}
              />
              {errors?.[`ingredients.${index}.name_en`] && (
                <p className="mt-1 text-xs text-favorite">{errors[`ingredients.${index}.name_en`]}</p>
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
      ))}

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
