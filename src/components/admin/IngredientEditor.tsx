import { useState } from 'react'
import { ArrowDown, ArrowUp, Pencil, Plus, Search, Trash2, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import type { AdminRecipeIngredient } from '@/hooks/useAdminRecipe'
import { useCurrentLang } from '@/hooks/useCurrentLang'
import { type IngredientWithCategory, useIngredients } from '@/hooks/useIngredients'
import { textMatchesQuery } from '@/lib/diacritics'
import { pickLocalized } from '@/lib/localizedField'
import { buildLocalizedPath } from '@/lib/localizedPath'
import { cn } from '@/lib/utils'

interface IngredientEditorProps {
  value: AdminRecipeIngredient[]
  onChange: (next: AdminRecipeIngredient[]) => void
  errors?: Record<string, string>
}

const inputClass =
  'rounded-control border border-border bg-surface-elevated px-2.5 py-2 text-sm text-foreground placeholder:text-muted-foreground'

const EMPTY_DRAFT: AdminRecipeIngredient = {
  name_en: '',
  name_sr: '',
  quantity: '',
  unit_en: '',
  unit_sr: '',
  ingredient_id: '',
}

function IngredientEditor({ value, onChange, errors }: IngredientEditorProps) {
  const { t } = useTranslation()
  const lang = useCurrentLang()
  const { ingredients } = useIngredients()
  const [draft, setDraft] = useState<AdminRecipeIngredient>(EMPTY_DRAFT)
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)

  const trimmedQuery = query.trim()
  const suggestions =
    isOpen && trimmedQuery.length > 0
      ? ingredients
          .filter(
            (ingredient) =>
              textMatchesQuery(ingredient.name_en, trimmedQuery) ||
              (ingredient.name_sr ? textMatchesQuery(ingredient.name_sr, trimmedQuery) : false),
          )
          .slice(0, 6)
      : []

  function selectIngredient(ingredient: IngredientWithCategory) {
    setDraft((prev) => ({
      ...prev,
      name_en: ingredient.name_en,
      name_sr: ingredient.name_sr ?? '',
      unit_en: prev.unit_en || (ingredient.default_unit_en ?? ''),
      unit_sr: prev.unit_sr || (ingredient.default_unit_sr ?? ''),
      ingredient_id: ingredient.id,
    }))
    setQuery(pickLocalized(ingredient.name_en, ingredient.name_sr, lang))
    setIsOpen(false)
  }

  function handleQueryChange(next: string) {
    setQuery(next)
    setDraft((prev) => ({ ...prev, name_en: next, name_sr: prev.ingredient_id ? '' : prev.name_sr, ingredient_id: '' }))
    setIsOpen(true)
  }

  function startEdit(index: number) {
    const row = value[index]
    setEditingIndex(index)
    setDraft(row)
    setQuery(pickLocalized(row.name_en, row.name_sr, lang) || row.name_en)
  }

  function cancelEdit() {
    setEditingIndex(null)
    setDraft(EMPTY_DRAFT)
    setQuery('')
  }

  function commitDraft() {
    if (!draft.name_en.trim()) return
    if (editingIndex !== null) {
      onChange(value.map((row, i) => (i === editingIndex ? draft : row)))
    } else {
      onChange([...value, draft])
    }
    setEditingIndex(null)
    setDraft(EMPTY_DRAFT)
    setQuery('')
  }

  function removeRow(index: number) {
    onChange(value.filter((_, i) => i !== index))
    if (editingIndex === index) cancelEdit()
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
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            onFocus={() => setIsOpen(true)}
            onBlur={() => setTimeout(() => setIsOpen(false), 150)}
            placeholder={t('admin.recipeForm.searchIngredientPlaceholder')}
            autoComplete="off"
            className={cn(inputClass, 'w-full pl-8')}
          />

          {suggestions.length > 0 && (
            <ul className="absolute top-full left-0 z-20 mt-1 w-full max-w-xs overflow-hidden rounded-control border border-border bg-surface-elevated shadow-xl">
              {suggestions.map((ingredient) => (
                <li key={ingredient.id}>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => selectIngredient(ingredient)}
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

          {isOpen && trimmedQuery.length > 0 && suggestions.length === 0 && (
            <div className="absolute top-full left-0 z-20 mt-1 w-full max-w-xs rounded-control border border-border bg-surface-elevated p-3 text-sm shadow-xl">
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
          value={draft.quantity}
          onChange={(e) => setDraft((prev) => ({ ...prev, quantity: e.target.value }))}
          placeholder={t('admin.recipeForm.quantity')}
          inputMode="decimal"
          className={cn(inputClass, 'sm:w-24')}
        />
        <input
          value={draft.unit_en}
          onChange={(e) => setDraft((prev) => ({ ...prev, unit_en: e.target.value, unit_sr: e.target.value }))}
          placeholder={t('admin.recipeForm.unit')}
          className={cn(inputClass, 'sm:w-28')}
        />

        <div className="flex gap-2">
          <button
            type="button"
            onClick={commitDraft}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-control bg-accent px-3 py-2 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent-hover sm:flex-initial"
          >
            <Plus className="size-4" />
            {t('admin.recipeForm.addIngredient')}
          </button>
          {editingIndex !== null && (
            <button
              type="button"
              onClick={cancelEdit}
              aria-label={t('admin.recipeForm.cancelEdit')}
              className="flex size-9 shrink-0 items-center justify-center rounded-control border border-border text-muted-foreground hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
      </div>
      {errors?.[`ingredients.${editingIndex ?? value.length}.name_en`] && (
        <p className="text-xs text-favorite">{errors[`ingredients.${editingIndex ?? value.length}.name_en`]}</p>
      )}

      {value.length > 0 && (
        <div className="overflow-x-auto rounded-control border border-border">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-elevated text-xs text-muted-foreground uppercase">
                <th className="w-8 px-2 py-2" />
                <th className="px-2 py-2 font-medium">{t('admin.recipeForm.ingredientNameSr')}</th>
                <th className="px-2 py-2 font-medium">{t('admin.recipeForm.ingredientNameEn')}</th>
                <th className="px-2 py-2 font-medium">{t('admin.recipeForm.quantity')}</th>
                <th className="px-2 py-2 font-medium">{t('admin.recipeForm.unit')}</th>
                <th className="px-2 py-2 text-right font-medium">{t('admin.recipeForm.remove')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {value.map((row, index) => (
                <tr key={index} className={cn(editingIndex === index && 'bg-accent-soft/40')}>
                  <td className="px-2 py-2 text-muted-foreground">{index + 1}</td>
                  <td className="px-2 py-2 text-foreground">{row.name_sr || '—'}</td>
                  <td className="px-2 py-2 text-foreground">{row.name_en}</td>
                  <td className="px-2 py-2 text-foreground">{row.quantity || '—'}</td>
                  <td className="px-2 py-2 text-foreground">{row.unit_en || '—'}</td>
                  <td className="px-2 py-2">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => moveRow(index, -1)}
                        disabled={index === 0}
                        aria-label={t('admin.recipeForm.moveUp')}
                        className="flex size-7 items-center justify-center rounded-control text-muted-foreground hover:bg-surface-elevated hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <ArrowUp className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveRow(index, 1)}
                        disabled={index === value.length - 1}
                        aria-label={t('admin.recipeForm.moveDown')}
                        className="flex size-7 items-center justify-center rounded-control text-muted-foreground hover:bg-surface-elevated hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <ArrowDown className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => startEdit(index)}
                        aria-label={t('admin.recipeForm.edit')}
                        className="flex size-7 items-center justify-center rounded-control text-muted-foreground hover:bg-surface-elevated hover:text-foreground"
                      >
                        <Pencil className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeRow(index)}
                        aria-label={t('admin.recipeForm.remove')}
                        className="flex size-7 items-center justify-center rounded-control text-favorite hover:bg-favorite/10"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default IngredientEditor
