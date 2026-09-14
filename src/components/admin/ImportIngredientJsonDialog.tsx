import { useState } from 'react'
import { AlertCircle, CheckCircle2, Info, Upload } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import JsonEditorField from '@/components/admin/JsonEditorField'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ingredientImportSchema, resolveIngredientImport, type IngredientImportWarning } from '@/lib/ingredientImport'
import type { IngredientFormState } from '@/lib/ingredientFormState'
import type { IngredientCategory, Mineral, Vitamin } from '@/types/ingredient'

const PLACEHOLDER_JSON = `{
  "name_sr": "Mleko",
  "name_en": "Milk",
  "category": "mleko-i-mlecni-proizvodi",
  "calories_kcal": 62
}`

interface ImportIngredientJsonDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  categories: IngredientCategory[]
  vitamins: Vitamin[]
  minerals: Mineral[]
  onImport: (formState: IngredientFormState) => void
}

function ImportIngredientJsonDialog({
  open,
  onOpenChange,
  categories,
  vitamins,
  minerals,
  onImport,
}: ImportIngredientJsonDialogProps) {
  const { t } = useTranslation()
  const [jsonText, setJsonText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [warnings, setWarnings] = useState<IngredientImportWarning[] | null>(null)

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

    const parseResult = ingredientImportSchema.safeParse(parsed)
    if (!parseResult.success) {
      const [firstIssue] = parseResult.error.issues
      const path = firstIssue.path.join('.')
      const message = firstIssue.message.startsWith('errors.') ? t(firstIssue.message) : firstIssue.message
      setError(path ? t('admin.recipeForm.importValidationFailed', { path, message }) : message)
      return
    }

    const { formState, warnings: resolvedWarnings } = resolveIngredientImport(parseResult.data, {
      categories,
      vitamins,
      minerals,
    })
    onImport(formState)
    if (resolvedWarnings.length > 0) {
      setWarnings(resolvedWarnings)
    } else {
      handleOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('admin.ingredients.importDialogTitle')}</DialogTitle>
          <DialogDescription>{t('admin.ingredients.importDialogDescription')}</DialogDescription>
        </DialogHeader>

        {warnings ? (
          <div className="flex flex-col gap-4">
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
          <div className="flex flex-col gap-4">
            <JsonEditorField value={jsonText} onChange={setJsonText} hasError={!!error} placeholder={PLACEHOLDER_JSON} />

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
                <p className="text-sm font-medium text-sky-300">{t('admin.recipeForm.importTip')}</p>
                <p className="text-xs text-sky-300/80">{t('admin.ingredients.importTipText')}</p>
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

export default ImportIngredientJsonDialog
