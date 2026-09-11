import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useCurrentLang } from '@/hooks/useCurrentLang'
import type { RecipeOption } from '@/hooks/useRecipeOptions'
import { pickLocalized } from '@/lib/localizedField'
import type { KitchenNote } from '@/types/kitchenNote'

export type NoteFormValues = {
  title_en: string
  title_sr: string | null
  body_en: string | null
  body_sr: string | null
  recipe_id: string | null
}

interface NoteFormDialogProps {
  note: KitchenNote | null | undefined // undefined = closed, null = create, KitchenNote = edit
  recipeOptions: RecipeOption[]
  isSaving: boolean
  error: string | null
  onSave: (values: NoteFormValues) => void
  onOpenChange: (open: boolean) => void
}

function NoteFormDialog({ note, recipeOptions, isSaving, error, onSave, onOpenChange }: NoteFormDialogProps) {
  const open = note !== undefined

  return (
    <Dialog open={open} onOpenChange={(next) => !isSaving && onOpenChange(next)}>
      <DialogContent>
        {open && (
          <NoteForm
            key={note?.id ?? 'create'}
            note={note}
            recipeOptions={recipeOptions}
            isSaving={isSaving}
            error={error}
            onSave={onSave}
            onCancel={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

interface NoteFormProps {
  note: KitchenNote | null
  recipeOptions: RecipeOption[]
  isSaving: boolean
  error: string | null
  onSave: (values: NoteFormValues) => void
  onCancel: () => void
}

function NoteForm({ note, recipeOptions, isSaving, error, onSave, onCancel }: NoteFormProps) {
  const { t } = useTranslation()
  const lang = useCurrentLang()

  const [titleEn, setTitleEn] = useState(note?.title_en ?? '')
  const [titleSr, setTitleSr] = useState(note?.title_sr ?? '')
  const [bodyEn, setBodyEn] = useState(note?.body_en ?? '')
  const [bodySr, setBodySr] = useState(note?.body_sr ?? '')
  const [recipeId, setRecipeId] = useState(note?.recipe?.id ?? '')
  const [titleError, setTitleError] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!titleEn.trim()) {
      setTitleError(true)
      return
    }

    onSave({
      title_en: titleEn.trim(),
      title_sr: titleSr.trim() || null,
      body_en: bodyEn.trim() || null,
      body_sr: bodySr.trim() || null,
      recipe_id: recipeId || null,
    })
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{note ? t('admin.notes.editTitle') : t('admin.notes.createTitle')}</DialogTitle>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-foreground">{t('admin.notes.titleEn')}</span>
          <input
            value={titleEn}
            onChange={(e) => {
              setTitleEn(e.target.value)
              setTitleError(false)
            }}
            className={`rounded-control border bg-surface-elevated px-2.5 py-2 text-sm text-foreground ${
              titleError ? 'border-favorite' : 'border-border'
            }`}
          />
          {titleError && <span className="text-xs text-favorite">{t('admin.notes.titleRequired')}</span>}
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-foreground">{t('admin.notes.titleSr')}</span>
          <input
            value={titleSr}
            onChange={(e) => setTitleSr(e.target.value)}
            className="rounded-control border border-border bg-surface-elevated px-2.5 py-2 text-sm text-foreground"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-foreground">{t('admin.notes.bodyEn')}</span>
          <textarea
            value={bodyEn}
            onChange={(e) => setBodyEn(e.target.value)}
            rows={4}
            className="rounded-control border border-border bg-surface-elevated px-2.5 py-2 text-sm text-foreground"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-foreground">{t('admin.notes.bodySr')}</span>
          <textarea
            value={bodySr}
            onChange={(e) => setBodySr(e.target.value)}
            rows={4}
            className="rounded-control border border-border bg-surface-elevated px-2.5 py-2 text-sm text-foreground"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-foreground">{t('admin.notes.linkedRecipe')}</span>
          <select
            value={recipeId}
            onChange={(e) => setRecipeId(e.target.value)}
            className="rounded-control border border-border bg-surface-elevated px-2.5 py-2 text-sm text-foreground"
          >
            <option value="">{t('admin.notes.noLinkedRecipe')}</option>
            {recipeOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {pickLocalized(option.name_en, option.name_sr, lang)}
              </option>
            ))}
          </select>
        </label>

        {error && <p className="text-sm text-favorite">{error}</p>}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSaving}
            className="rounded-control border border-border px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            {t('admin.notes.cancel')}
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="rounded-control bg-accent px-3 py-2 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSaving ? t('admin.notes.saving') : t('admin.notes.save')}
          </button>
        </div>
      </form>
    </>
  )
}

export default NoteFormDialog
