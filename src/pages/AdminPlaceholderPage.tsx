import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabaseClient'

// Stands in for the real admin screens (Phase 14+) — content lives inside
// AdminShell now, which owns the logged-in indicator and logout action.
// Keeps the one-click RLS smoke test as a handy regression check.
function AdminPlaceholderPage({ title }: { title: string }) {
  const { t } = useTranslation()
  const [rlsResult, setRlsResult] = useState<'idle' | 'testing' | 'pass' | 'fail'>('idle')
  const [rlsMessage, setRlsMessage] = useState('')

  async function runRlsSmokeTest() {
    setRlsResult('testing')
    const { data, error: insertError } = await supabase
      .from('kitchen_notes')
      .insert({ title_en: 'RLS smoke test', title_sr: 'RLS test' })
      .select('id')
      .single()

    if (insertError) {
      setRlsResult('fail')
      setRlsMessage(insertError.message)
      return
    }

    const { error: deleteError } = await supabase.from('kitchen_notes').delete().eq('id', data.id)
    if (deleteError) {
      setRlsResult('fail')
      setRlsMessage(deleteError.message)
      return
    }

    setRlsResult('pass')
    setRlsMessage('')
  }

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 rounded-card border border-dashed border-border p-10 text-center">
      <h1 className="text-xl font-semibold">{title}</h1>
      <p className="max-w-sm text-sm text-muted-foreground">{t('placeholder.notImplemented')}</p>

      <button
        type="button"
        onClick={() => void runRlsSmokeTest()}
        disabled={rlsResult === 'testing'}
        className="rounded-control border border-border px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
      >
        {t('login.rlsTest')}
      </button>

      {rlsResult === 'pass' && <p className="text-sm text-emerald-400">{t('login.rlsPass')}</p>}
      {rlsResult === 'fail' && (
        <p className="text-sm text-favorite">
          {t('login.rlsFail')} ({rlsMessage})
        </p>
      )}
    </div>
  )
}

export default AdminPlaceholderPage
