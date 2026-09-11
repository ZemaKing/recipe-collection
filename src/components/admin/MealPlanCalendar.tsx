import { Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useCurrentLang } from '@/hooks/useCurrentLang'
import { pickLocalized } from '@/lib/localizedField'
import { formatDateKey, MEAL_SLOTS, type MealSlot } from '@/lib/weekDates'
import type { MealPlanEntry } from '@/types/mealPlan'

interface MealPlanCalendarProps {
  weekDates: Date[]
  entries: MealPlanEntry[]
  onSlotClick: (dateKey: string, slot: MealSlot, existingEntry: MealPlanEntry | null) => void
}

function MealPlanCalendar({ weekDates, entries, onSlotClick }: MealPlanCalendarProps) {
  const { t } = useTranslation()
  const lang = useCurrentLang()
  const dayFormatter = new Intl.DateTimeFormat(lang === 'sr' ? 'sr-RS' : 'en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })

  function findEntry(dateKey: string, slot: MealSlot): MealPlanEntry | null {
    return entries.find((entry) => entry.plan_date === dateKey && entry.slot === slot) ?? null
  }

  return (
    <div className="overflow-x-auto rounded-card border border-border bg-surface">
      <div className="grid min-w-[840px] grid-cols-[100px_repeat(7,1fr)]">
        <div className="border-b border-border" />
        {weekDates.map((date) => (
          <div
            key={formatDateKey(date)}
            className="border-b border-border px-2 py-3 text-center text-sm font-semibold text-foreground"
          >
            {dayFormatter.format(date)}
          </div>
        ))}

        {MEAL_SLOTS.map((slot) => (
          <div key={slot} className="contents">
            <div className="flex items-center border-b border-border px-3 py-3 text-sm font-medium text-muted-foreground">
              {t(`admin.mealPlan.slots.${slot}`)}
            </div>
            {weekDates.map((date) => {
              const dateKey = formatDateKey(date)
              const entry = findEntry(dateKey, slot)
              const recipeName = entry?.recipe
                ? pickLocalized(entry.recipe.name_en, entry.recipe.name_sr, lang)
                : null

              return (
                <button
                  key={`${dateKey}-${slot}`}
                  type="button"
                  onClick={() => onSlotClick(dateKey, slot, entry)}
                  className="flex min-h-[64px] flex-col items-start justify-center gap-0.5 border-b border-l border-border px-2 py-2 text-left text-xs transition-colors hover:bg-surface-hover"
                >
                  {entry && entry.recipe && (
                    <span className="line-clamp-2 font-medium text-foreground">{recipeName}</span>
                  )}
                  {entry && !entry.recipe && (
                    <span className="italic text-favorite">{t('admin.mealPlan.recipeRemoved')}</span>
                  )}
                  {entry?.note && (
                    <span className="line-clamp-1 text-muted-foreground">{entry.note}</span>
                  )}
                  {!entry && <Plus className="size-4 text-muted-foreground" />}
                </button>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

export default MealPlanCalendar
