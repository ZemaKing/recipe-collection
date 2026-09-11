import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { AdminRecipeStep } from '@/hooks/useAdminRecipe'

interface StepEditorProps {
  value: AdminRecipeStep[]
  onChange: (next: AdminRecipeStep[]) => void
  errors?: Record<string, string>
}

const textareaClass =
  'w-full rounded-control border border-border bg-surface-elevated px-2.5 py-1.5 text-sm text-foreground placeholder:text-muted-foreground'

function StepEditor({ value, onChange, errors }: StepEditorProps) {
  const { t } = useTranslation()

  function updateRow(index: number, patch: Partial<AdminRecipeStep>) {
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
        <div key={index} className="flex gap-3 rounded-card border border-border bg-surface p-3">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-semibold text-accent-foreground">
            {index + 1}
          </span>

          <div className="flex flex-1 flex-col gap-2">
            <textarea
              value={row.text_en}
              onChange={(e) => updateRow(index, { text_en: e.target.value })}
              placeholder={t('admin.recipeForm.stepTextEn')}
              rows={2}
              className={textareaClass}
            />
            {errors?.[`steps.${index}.text_en`] && (
              <p className="text-xs text-favorite">{errors[`steps.${index}.text_en`]}</p>
            )}
            <textarea
              value={row.text_sr}
              onChange={(e) => updateRow(index, { text_sr: e.target.value })}
              placeholder={t('admin.recipeForm.stepTextSr')}
              rows={2}
              className={textareaClass}
            />

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
        </div>
      ))}

      <button
        type="button"
        onClick={() => onChange([...value, { text_en: '', text_sr: '' }])}
        className="flex items-center justify-center gap-1.5 rounded-control border border-dashed border-border px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <Plus className="size-4" />
        {t('admin.recipeForm.addStep')}
      </button>
    </div>
  )
}

export default StepEditor
