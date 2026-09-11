import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useCurrentLang } from '@/hooks/useCurrentLang'
import type { RecipeOption } from '@/hooks/useRecipeOptions'
import { pickLocalized } from '@/lib/localizedField'
import type { MealSlot } from '@/lib/weekDates'
import type { MealPlanEntry } from '@/types/mealPlan'

export interface MealPlanEntryTarget {
  dateKey: string
  slot: MealSlot
  entry: MealPlanEntry | null
}

interface MealPlanEntryDialogProps {
  target: MealPlanEntryTarget | null
  recipeOptions: RecipeOption[]
  isSaving: boolean
  error: string | null
  onSave: (recipeId: string, note: string | null) => void
  onRemove: () => void
  onOpenChange: (open: boolean) => void
}

function MealPlanEntryDialog({
  target,
  recipeOptions,
  isSaving,
  error,
  onSave,
  onRemove,
  onOpenChange,
}: MealPlanEntryDialogProps) {
  return (
    <Dialog open={target !== null} onOpenChange={(open) => !isSaving && onOpenChange(open)}>
      <DialogContent>
        {target && (
          <MealPlanEntryForm
            key={`${target.dateKey}-${target.slot}`}
            target={target}
            recipeOptions={recipeOptions}
            isSaving={isSaving}
            error={error}
            onSave={onSave}
            onRemove={onRemove}
            onCancel={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

interface MealPlanEntryFormProps {
  target: MealPlanEntryTarget
  recipeOptions: RecipeOption[]
  isSaving: boolean
  error: string | null
  onSave: (recipeId: string, note: string | null) => void
  onRemove: () => void
  onCancel: () => void
}

function MealPlanEntryForm({
  target,
  recipeOptions,
  isSaving,
  error,
  onSave,
  onRemove,
  onCancel,
}: MealPlanEntryFormProps) {
  const { t } = useTranslation()
  const lang = useCurrentLang()

  const currentRecipeId = target.entry?.recipe?.id ?? null
  const [selectedRecipeId, setSelectedRecipeId] = useState(currentRecipeId ?? '')
  const [note, setNote] = useState(target.entry?.note ?? '')
  const [confirmOverwrite, setConfirmOverwrite] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedRecipeId) return

    if (currentRecipeId && currentRecipeId !== selectedRecipeId && !confirmOverwrite) {
      setConfirmOverwrite(true)
      return
    }

    onSave(selectedRecipeId, note.trim() || null)
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>
          {target.entry ? t('admin.mealPlan.dialog.editTitle') : t('admin.mealPlan.dialog.createTitle')}
        </DialogTitle>
        <DialogDescription>
          {t(`admin.mealPlan.slots.${target.slot}`)} — {target.dateKey}
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-foreground">{t('admin.mealPlan.dialog.recipeLabel')}</span>
          <select
            value={selectedRecipeId}
            onChange={(e) => {
              setSelectedRecipeId(e.target.value)
              setConfirmOverwrite(false)
            }}
            className="rounded-control border border-border bg-surface-elevated px-2.5 py-2 text-sm text-foreground"
          >
            <option value="">{t('admin.mealPlan.dialog.recipePlaceholder')}</option>
            {recipeOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {pickLocalized(option.name_en, option.name_sr, lang)}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-foreground">{t('admin.mealPlan.dialog.noteLabel')}</span>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={t('admin.mealPlan.dialog.notePlaceholder')}
            rows={2}
            className="rounded-control border border-border bg-surface-elevated px-2.5 py-2 text-sm text-foreground placeholder:text-muted-foreground"
          />
        </label>

        {confirmOverwrite && (
          <p className="text-sm text-accent">{t('admin.mealPlan.dialog.overwriteWarning')}</p>
        )}
        {error && <p className="text-sm text-favorite">{error}</p>}

        <div className="flex items-center justify-between gap-2">
          {target.entry ? (
            <button
              type="button"
              onClick={onRemove}
              disabled={isSaving}
              className="rounded-control border border-border px-3 py-2 text-sm font-medium text-favorite transition-colors hover:bg-favorite/10 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {t('admin.mealPlan.dialog.remove')}
            </button>
          ) : (
            <span />
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onCancel}
              disabled={isSaving}
              className="rounded-control border border-border px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-50"
            >
              {t('admin.mealPlan.dialog.cancel')}
            </button>
            <button
              type="submit"
              disabled={isSaving || !selectedRecipeId}
              className="rounded-control bg-accent px-3 py-2 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSaving
                ? t('admin.mealPlan.dialog.saving')
                : confirmOverwrite
                  ? t('admin.mealPlan.dialog.confirmOverwrite')
                  : t('admin.mealPlan.dialog.save')}
            </button>
          </div>
        </div>
      </form>
    </>
  )
}

export default MealPlanEntryDialog
