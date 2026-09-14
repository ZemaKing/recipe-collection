import { Pin } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useCurrentLang } from '@/hooks/useCurrentLang'
import { pickLocalized } from '@/lib/localizedField'
import type { KitchenNote } from '@/types/kitchenNote'

interface RecipeNotesPanelProps {
  notes: KitchenNote[]
}

function RecipeNotesPanel({ notes }: RecipeNotesPanelProps) {
  const { t } = useTranslation()
  const lang = useCurrentLang()

  if (notes.length === 0) return null

  return (
    <div className="rounded-card border border-border bg-surface p-4">
      <h2 className="mb-3 text-sm font-semibold text-foreground">{t('recipeDetail.notes.title')}</h2>
      <div className="flex flex-col gap-3">
        {notes.map((note) => {
          const title = pickLocalized(note.title_en, note.title_sr, lang)
          const body = pickLocalized(note.body_en ?? '', note.body_sr, lang)
          return (
            <div key={note.id} className="rounded-control border border-border-subtle bg-surface-elevated p-3">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-sm font-medium text-foreground">{title}</h3>
                {note.is_pinned && <Pin className="mt-0.5 size-3.5 shrink-0 text-accent" />}
              </div>
              {body && <p className="mt-1 text-sm text-muted-foreground">{body}</p>}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default RecipeNotesPanel
