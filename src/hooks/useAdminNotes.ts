import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import type { KitchenNote } from '@/types/kitchenNote'

export function useAdminNotes() {
  const [notes, setNotes] = useState<KitchenNote[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refetchToken, setRefetchToken] = useState(0)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setIsLoading(true)
      const { data, error } = await supabase
        .from('kitchen_notes')
        .select('id, title_en, title_sr, body_en, body_sr, is_pinned, created_at, recipe:recipes(id, slug, name_en, name_sr)')
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false })

      if (cancelled) return
      if (error) {
        setError(error.message)
      } else {
        setNotes((data ?? []) as unknown as KitchenNote[])
        setError(null)
      }
      setIsLoading(false)
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [refetchToken])

  function refetch() {
    setRefetchToken((token) => token + 1)
  }

  async function togglePin(noteId: string) {
    const current = notes.find((note) => note.id === noteId)
    if (!current) return
    const nextValue = !current.is_pinned

    setNotes((prev) =>
      prev
        .map((note) => (note.id === noteId ? { ...note, is_pinned: nextValue } : note))
        .sort((a, b) => {
          if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1
          return b.created_at.localeCompare(a.created_at)
        }),
    )

    const { error } = await supabase.from('kitchen_notes').update({ is_pinned: nextValue }).eq('id', noteId)
    if (error) refetch()
  }

  return { notes, isLoading, error, refetch, togglePin }
}
