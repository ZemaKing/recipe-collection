import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import type { Mineral } from '@/types/ingredient'

export function useMinerals() {
  const [minerals, setMinerals] = useState<Mineral[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setIsLoading(true)
      const { data } = await supabase.from('minerals').select('id, code, name_en, name_sr, unit').order('name_en')
      if (cancelled) return
      setMinerals(data ?? [])
      setIsLoading(false)
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [])

  return { minerals, isLoading }
}
