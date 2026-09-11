import { useTranslation } from 'react-i18next'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface DeleteNoteDialogProps {
  noteTitle: string | null
  isDeleting: boolean
  error: string | null
  onConfirm: () => void
  onOpenChange: (open: boolean) => void
}

function DeleteNoteDialog({ noteTitle, isDeleting, error, onConfirm, onOpenChange }: DeleteNoteDialogProps) {
  const { t } = useTranslation()

  return (
    <Dialog open={noteTitle !== null} onOpenChange={(open) => !isDeleting && onOpenChange(open)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('admin.notes.deleteTitle')}</DialogTitle>
          <DialogDescription>{t('admin.notes.deleteDescription', { title: noteTitle })}</DialogDescription>
        </DialogHeader>

        {error && <p className="mb-3 text-sm text-favorite">{error}</p>}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
            className="rounded-control border border-border px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            {t('admin.notes.cancel')}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="rounded-control bg-favorite px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-favorite/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isDeleting ? t('admin.notes.deleting') : t('admin.notes.confirmDelete')}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default DeleteNoteDialog
