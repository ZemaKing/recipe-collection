import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import type { Vitamin } from '@/types/ingredient'

export function useVitamins() {
  const [vitamins, setVitamins] = useState<Vitamin[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setIsLoading(true)
      const { data } = await supabase.from('vitamins').select('id, code, name_en, name_sr, unit').order('name_en')
      if (cancelled) return
      setVitamins(data ?? [])
      setIsLoading(false)
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [])

  return { vitamins, isLoading }
}
