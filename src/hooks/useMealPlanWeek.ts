import { useEffect, useState } from 'react'
import { formatDateKey, getWeekDates } from '@/lib/weekDates'
import { supabase } from '@/lib/supabaseClient'
import type { MealPlanEntry } from '@/types/mealPlan'

export function useMealPlanWeek(weekStart: Date) {
  const [entries, setEntries] = useState<MealPlanEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refetchToken, setRefetchToken] = useState(0)

  const weekDates = getWeekDates(weekStart)
  const fromKey = formatDateKey(weekDates[0])
  const toKey = formatDateKey(weekDates[6])

  useEffect(() => {
    let cancelled = false

    async function load() {
      setIsLoading(true)
      const { data, error } = await supabase
        .from('meal_plan_entries')
        .select('id, plan_date, slot, note, recipe:recipes(id, slug, name_en, name_sr)')
        .gte('plan_date', fromKey)
        .lte('plan_date', toKey)

      if (cancelled) return
      if (error) {
        setError(error.message)
      } else {
        setEntries((data ?? []) as unknown as MealPlanEntry[])
        setError(null)
      }
      setIsLoading(false)
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [fromKey, toKey, refetchToken])

  function refetch() {
    setRefetchToken((token) => token + 1)
  }

  return { entries, isLoading, error, refetch }
}
