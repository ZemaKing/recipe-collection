import { Pencil, Pin, PinOff, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useCurrentLang } from '@/hooks/useCurrentLang'
import { pickLocalized } from '@/lib/localizedField'
import type { KitchenNote } from '@/types/kitchenNote'

interface NoteCardProps {
  note: KitchenNote
  onTogglePin: () => void
  onEdit: () => void
  onDelete: () => void
}

function NoteCard({ note, onTogglePin, onEdit, onDelete }: NoteCardProps) {
  const { t } = useTranslation()
  const lang = useCurrentLang()

  const title = pickLocalized(note.title_en, note.title_sr, lang)
  const body = pickLocalized(note.body_en ?? '', note.body_sr, lang)
  const recipeName = note.recipe ? pickLocalized(note.recipe.name_en, note.recipe.name_sr, lang) : null

  return (
    <div className="flex flex-col gap-2 rounded-card border border-border bg-surface p-4">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-foreground">{title}</h3>
        <button
          type="button"
          onClick={onTogglePin}
          aria-label={note.is_pinned ? t('admin.notes.unpin') : t('admin.notes.pin')}
          className={`flex size-7 shrink-0 items-center justify-center rounded-control border border-border transition-colors ${
            note.is_pinned ? 'bg-accent-soft text-accent' : 'text-muted-foreground hover:bg-surface-hover'
          }`}
        >
          {note.is_pinned ? <Pin className="size-3.5" /> : <PinOff className="size-3.5" />}
        </button>
      </div>

      {body && <p className="line-clamp-3 text-sm text-muted-foreground">{body}</p>}

      {recipeName && (
        <span className="w-fit rounded-control bg-surface-elevated px-2 py-0.5 text-xs text-muted-foreground">
          {recipeName}
        </span>
      )}

      <div className="mt-1 flex items-center gap-2">
        <button
          type="button"
          onClick={onEdit}
          className="flex items-center gap-1 rounded-control border border-border px-2.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-surface-hover"
        >
          <Pencil className="size-3.5" />
          {t('admin.notes.edit')}
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="flex items-center gap-1 rounded-control border border-border px-2.5 py-1.5 text-xs font-medium text-favorite transition-colors hover:bg-favorite/10"
        >
          <Trash2 className="size-3.5" />
          {t('admin.notes.delete')}
        </button>
      </div>
    </div>
  )
}

export default NoteCard
