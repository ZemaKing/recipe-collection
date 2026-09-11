import { useState } from 'react'
import { NotebookPen, Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import DeleteNoteDialog from '@/components/admin/DeleteNoteDialog'
import NoteCard from '@/components/admin/NoteCard'
import NoteFormDialog, { type NoteFormValues } from '@/components/admin/NoteFormDialog'
import EmptyState from '@/components/ui/EmptyState'
import { useAdminNotes } from '@/hooks/useAdminNotes'
import { useCurrentLang } from '@/hooks/useCurrentLang'
import { useDeleteNote } from '@/hooks/useDeleteNote'
import { useRecipeOptions } from '@/hooks/useRecipeOptions'
import { useSaveNote } from '@/hooks/useSaveNote'
import { pickLocalized } from '@/lib/localizedField'
import type { KitchenNote } from '@/types/kitchenNote'

function AdminNotesPage() {
  const { t } = useTranslation()
  const lang = useCurrentLang()

  const { notes, isLoading, error: loadError, refetch, togglePin } = useAdminNotes()
  const { options: recipeOptions } = useRecipeOptions()
  const { saveNote, isSaving, error: saveError } = useSaveNote()
  const { deleteNote, isDeleting, error: deleteError } = useDeleteNote()

  const [editingNote, setEditingNote] = useState<KitchenNote | null | undefined>(undefined)
  const [pendingDelete, setPendingDelete] = useState<KitchenNote | null>(null)

  async function handleSave(values: NoteFormValues) {
    await saveNote({ id: editingNote?.id, ...values })
    setEditingNote(undefined)
    refetch()
  }

  async function handleConfirmDelete() {
    if (!pendingDelete) return
    await deleteNote(pendingDelete.id)
    setPendingDelete(null)
    refetch()
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">{t('admin.nav.notes')}</h1>
        <button
          type="button"
          onClick={() => setEditingNote(null)}
          className="flex items-center gap-1.5 rounded-control bg-accent px-3 py-2 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent-hover"
        >
          <Plus className="size-4" />
          {t('admin.notes.addNote')}
        </button>
      </div>

      {loadError && <p className="text-sm text-favorite">{loadError}</p>}

      {!isLoading && notes.length === 0 && (
        <EmptyState
          icon={NotebookPen}
          title={t('admin.notes.emptyTitle')}
          description={t('admin.notes.emptyDescription')}
        />
      )}

      {notes.length > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {notes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              onTogglePin={() => void togglePin(note.id)}
              onEdit={() => setEditingNote(note)}
              onDelete={() => setPendingDelete(note)}
            />
          ))}
        </div>
      )}

      <NoteFormDialog
        note={editingNote}
        recipeOptions={recipeOptions}
        isSaving={isSaving}
        error={saveError}
        onSave={(values) => void handleSave(values)}
        onOpenChange={(open) => !open && setEditingNote(undefined)}
      />

      <DeleteNoteDialog
        noteTitle={pendingDelete ? pickLocalized(pendingDelete.title_en, pendingDelete.title_sr, lang) : null}
        isDeleting={isDeleting}
        error={deleteError}
        onConfirm={() => void handleConfirmDelete()}
        onOpenChange={(open) => !open && setPendingDelete(null)}
      />
    </div>
  )
}

export default AdminNotesPage
