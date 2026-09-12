import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabaseClient'

export function useDeleteCategory() {
  const { t } = useTranslation()
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function deleteCategory(categoryId: string): Promise<void> {
    setIsDeleting(true)
    setError(null)
    try {
      const { error } = await supabase.from('categories').delete().eq('id', categoryId)
      if (error) throw error
    } catch (err) {
      const isForeignKeyViolation =
        typeof err === 'object' && err !== null && 'code' in err && (err as { code: unknown }).code === '23503'
      const message = isForeignKeyViolation
        ? t('admin.categories.deleteInUse')
        : err instanceof Error
          ? err.message
          : 'Unknown error'
      setError(message)
      throw err
    } finally {
      setIsDeleting(false)
    }
  }

  return { deleteCategory, isDeleting, error }
}
