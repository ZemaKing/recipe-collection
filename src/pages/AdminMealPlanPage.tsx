import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import MealPlanCalendar from '@/components/admin/MealPlanCalendar'
import MealPlanEntryDialog, { type MealPlanEntryTarget } from '@/components/admin/MealPlanEntryDialog'
import { useCurrentLang } from '@/hooks/useCurrentLang'
import { useMealPlanWeek } from '@/hooks/useMealPlanWeek'
import { useRecipeOptions } from '@/hooks/useRecipeOptions'
import { useSaveMealPlanEntry } from '@/hooks/useSaveMealPlanEntry'
import { addWeeks, getWeekDates, getWeekStart } from '@/lib/weekDates'

function AdminMealPlanPage() {
  const { t } = useTranslation()
  const lang = useCurrentLang()

  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()))
  const weekDates = getWeekDates(weekStart)
  const [target, setTarget] = useState<MealPlanEntryTarget | null>(null)

  const { entries, isLoading, error: loadError, refetch } = useMealPlanWeek(weekStart)
  const { options: recipeOptions } = useRecipeOptions()
  const { saveEntry, deleteEntry, isSaving, error: saveError } = useSaveMealPlanEntry()

  const rangeFormatter = new Intl.DateTimeFormat(lang === 'sr' ? 'sr-RS' : 'en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

  async function handleSave(recipeId: string, note: string | null) {
    if (!target) return
    await saveEntry({ plan_date: target.dateKey, slot: target.slot, recipe_id: recipeId, note })
    setTarget(null)
    refetch()
  }

  async function handleRemove() {
    if (!target?.entry) return
    await deleteEntry(target.entry.id)
    setTarget(null)
    refetch()
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">{t('admin.nav.mealPlan')}</h1>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setWeekStart((prev) => addWeeks(prev, -1))}
            aria-label={t('admin.mealPlan.previousWeek')}
            className="flex size-8 items-center justify-center rounded-control border border-border text-foreground hover:bg-surface-hover"
          >
            <ChevronLeft className="size-4" />
          </button>
          <span className="min-w-[180px] text-center text-sm font-medium text-foreground">
            {rangeFormatter.format(weekDates[0])} – {rangeFormatter.format(weekDates[6])}
          </span>
          <button
            type="button"
            onClick={() => setWeekStart((prev) => addWeeks(prev, 1))}
            aria-label={t('admin.mealPlan.nextWeek')}
            className="flex size-8 items-center justify-center rounded-control border border-border text-foreground hover:bg-surface-hover"
          >
            <ChevronRight className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => setWeekStart(getWeekStart(new Date()))}
            className="rounded-control border border-border px-3 py-1.5 text-sm font-medium text-foreground hover:bg-surface-hover"
          >
            {t('admin.mealPlan.today')}
          </button>
        </div>
      </div>

      {loadError && <p className="text-sm text-favorite">{loadError}</p>}

      {!isLoading && (
        <MealPlanCalendar
          weekDates={weekDates}
          entries={entries}
          onSlotClick={(dateKey, slot, existingEntry) => setTarget({ dateKey, slot, entry: existingEntry })}
        />
      )}

      <MealPlanEntryDialog
        target={target}
        recipeOptions={recipeOptions}
        isSaving={isSaving}
        error={saveError}
        onSave={(recipeId, note) => void handleSave(recipeId, note)}
        onRemove={() => void handleRemove()}
        onOpenChange={(open) => !open && setTarget(null)}
      />
    </div>
  )
}

export default AdminMealPlanPage
