import { useState } from 'react'
import { AlertCircle, CheckCircle2, Info, Upload } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import JsonEditorField from '@/components/admin/JsonEditorField'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import type { CategoryWithCount } from '@/hooks/useCategories'
import type { IngredientWithCategory } from '@/hooks/useIngredients'
import type { SubcategoryWithCount } from '@/hooks/useSubcategories'
import type { Tag } from '@/hooks/useTags'
import { recipeImportSchema, resolveRecipeImport, RecipeImportError, type RecipeImportWarning } from '@/lib/recipeImport'
import type { RecipeFormState } from '@/lib/recipeFormState'

const PLACEHOLDER_JSON = `{
  "name_sr": "Pileća supa",
  "name_en": "Chicken Soup",
  "description_sr": "...",
  "description_en": "..."
}`

interface ImportRecipeJsonDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  categories: CategoryWithCount[]
  subcategories: SubcategoryWithCount[]
  tags: Tag[]
  ingredients: IngredientWithCategory[]
  onImport: (formState: RecipeFormState) => void
}

function ImportRecipeJsonDialog({
  open,
  onOpenChange,
  categories,
  subcategories,
  tags,
  ingredients,
  onImport,
}: ImportRecipeJsonDialogProps) {
  const { t } = useTranslation()
  const [jsonText, setJsonText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [warnings, setWarnings] = useState<RecipeImportWarning[] | null>(null)

  function reset() {
    setJsonText('')
    setError(null)
    setWarnings(null)
  }

  function handleOpenChange(next: boolean) {
    if (!next) reset()
    onOpenChange(next)
  }

  function handleImport() {
    setError(null)

    let parsed: unknown
    try {
      parsed = JSON.parse(jsonText)
    } catch (err) {
      setError(t('admin.recipeForm.importInvalidJson', { message: err instanceof Error ? err.message : String(err) }))
      return
    }

    const parseResult = recipeImportSchema.safeParse(parsed)
    if (!parseResult.success) {
      const [firstIssue] = parseResult.error.issues
      const path = firstIssue.path.join('.')
      const message = firstIssue.message.startsWith('errors.') ? t(firstIssue.message) : firstIssue.message
      setError(path ? t('admin.recipeForm.importValidationFailed', { path, message }) : message)
      return
    }

    try {
      const { formState, warnings: resolvedWarnings } = resolveRecipeImport(parseResult.data, {
        categories,
        subcategories,
        tags,
        ingredients,
      })
      onImport(formState)
      if (resolvedWarnings.length > 0) {
        setWarnings(resolvedWarnings)
      } else {
        handleOpenChange(false)
      }
    } catch (err) {
      if (err instanceof RecipeImportError) {
        setError(t(err.messageKey, err.params))
      } else {
        setError(err instanceof Error ? err.message : String(err))
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('admin.recipeForm.importDialogTitle')}</DialogTitle>
          <DialogDescription>{t('admin.recipeForm.importDialogDescription')}</DialogDescription>
        </DialogHeader>

        {warnings ? (
          <div className="flex flex-col gap-4 max-h-[50vh]">
            <div className="flex items-start gap-2 rounded-control border border-emerald-500/40 bg-emerald-500/10 px-3 py-2.5 text-sm text-emerald-400">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
              <div className="flex flex-col gap-1">
                <p className="font-medium">{t('admin.recipeForm.importSuccess')}</p>
                {warnings.length > 0 && (
                  <ul className="list-disc pl-4 text-xs text-emerald-400/90">
                    {warnings.map((warning, index) => (
                      <li key={index}>{t(warning.key, { value: warning.value })}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => handleOpenChange(false)}
                className="rounded-control bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent-hover"
              >
                {t('admin.recipeForm.importDone')}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4 max-h-[50vh]">
            <JsonEditorField
              value={jsonText}
              onChange={setJsonText}
              hasError={!!error}
              placeholder={PLACEHOLDER_JSON}
            />

            {error && (
              <p className="flex items-start gap-1.5 text-xs text-favorite">
                <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
                <span>{error}</span>
              </p>
            )}

            <div className="flex items-start gap-2.5 rounded-control border border-sky-500/30 bg-sky-500/10 px-3 py-2.5">
              <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-sky-500 text-white">
                <Info className="size-3" />
              </span>
              <div className="flex flex-col gap-0.5">
                <p className="text-sm font-medium text-sky-300">
                  {t('admin.recipeForm.importTip')}
                </p>
                <p className="text-xs text-sky-300/80">{t('admin.recipeForm.importTipText')}</p>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => handleOpenChange(false)}
                className="rounded-control border border-border px-3 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-surface-hover"
              >
                {t('admin.recipeForm.cancel')}
              </button>
              <button
                type="button"
                onClick={handleImport}
                disabled={!jsonText.trim()}
                className="flex items-center gap-1.5 rounded-control bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Upload className="size-4" />
                {t('admin.recipeForm.importSubmit')}
              </button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default ImportRecipeJsonDialog
