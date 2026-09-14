import { useRef, useState } from 'react'
import { ImageOff, Loader2, RefreshCw, Trash2, UploadCloud } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useIngredientImage } from '@/hooks/useIngredientImage'
import { getIngredientImageUrl, validateIngredientImageFile } from '@/lib/storage'

interface IngredientImageManagerProps {
  ingredientId: string
}

const inputClass =
  'rounded-control border border-border bg-surface-elevated px-2.5 py-1.5 text-sm text-foreground placeholder:text-muted-foreground'

function IngredientImageManager({ ingredientId }: IngredientImageManagerProps) {
  const { t } = useTranslation()
  const { image, isLoading, setImageFile, removeImage, updateAlt } = useIngredientImage(ingredientId)
  const [error, setError] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isDraggingOver, setIsDraggingOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File | undefined) {
    if (!file) return
    setError(null)

    const validationError = validateIngredientImageFile(file)
    if (validationError) {
      setError(t(`admin.recipeForm.imageErrors.${validationError}`))
      return
    }

    setIsUploading(true)
    try {
      await setImageFile(file)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('admin.recipeForm.imageErrors.uploadFailed'))
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function handleRemove() {
    setError(null)
    try {
      await removeImage()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('admin.recipeForm.imageErrors.actionFailed'))
    }
  }

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">{t('admin.recipeForm.loadingImages')}</p>
  }

  if (image.storagePath) {
    return (
      <div className="flex flex-col gap-3 rounded-card border border-border bg-surface p-3 sm:flex-row">
        <div className="relative aspect-[3/2] w-full shrink-0 overflow-hidden rounded-control bg-surface-elevated sm:w-40">
          <img
            src={getIngredientImageUrl(image.storagePath)}
            alt=""
            loading="lazy"
            decoding="async"
            className="size-full object-cover"
          />
          {isUploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-surface/70">
              <Loader2 className="size-5 animate-spin text-foreground" />
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-2">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <input
              defaultValue={image.altSr}
              onBlur={(e) => void updateAlt(image.altEn, e.target.value)}
              placeholder={t('admin.recipeForm.altSr')}
              className={inputClass}
            />
            <input
              defaultValue={image.altEn}
              onBlur={(e) => void updateAlt(e.target.value, image.altSr)}
              placeholder={t('admin.recipeForm.altEn')}
              className={inputClass}
            />
          </div>

          {error && <p className="text-xs text-favorite">{error}</p>}

          <div className="flex flex-wrap items-center gap-1">
            <label className="flex cursor-pointer items-center gap-1 rounded-control border border-border px-2 py-1 text-xs font-medium text-muted-foreground hover:text-foreground">
              <RefreshCw className="size-3.5" />
              {t('admin.recipeForm.replaceImage')}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                disabled={isUploading}
                onChange={(e) => void handleFile(e.target.files?.[0])}
              />
            </label>
            <button
              type="button"
              onClick={() => void handleRemove()}
              aria-label={t('admin.recipeForm.remove')}
              className="flex size-7 items-center justify-center rounded-control border border-border text-favorite hover:bg-favorite/10"
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <label
        onDragOver={(e) => {
          e.preventDefault()
          setIsDraggingOver(true)
        }}
        onDragLeave={() => setIsDraggingOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setIsDraggingOver(false)
          void handleFile(e.dataTransfer.files?.[0])
        }}
        className={`flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-card border border-dashed px-3 py-8 text-center text-sm font-medium transition-colors ${
          isDraggingOver
            ? 'border-accent bg-accent-soft text-foreground'
            : 'border-border text-muted-foreground hover:border-accent hover:text-foreground'
        }`}
      >
        {isUploading ? (
          <Loader2 className="size-6 animate-spin text-accent" />
        ) : (
          <UploadCloud className="size-6 text-accent" />
        )}
        <span>{t('admin.ingredients.dropImageHere')}</span>
        <span className="text-xs font-normal text-muted-foreground">{t('admin.recipeForm.clickToBrowse')}</span>
        <span className="text-xs font-normal text-muted-foreground">{t('admin.recipeForm.imageHint')}</span>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          disabled={isUploading}
          className="hidden"
          onChange={(e) => void handleFile(e.target.files?.[0])}
        />
      </label>
      {error && (
        <p className="flex items-center gap-1.5 text-xs text-favorite">
          <ImageOff className="size-3.5 shrink-0" />
          {error}
        </p>
      )}
    </div>
  )
}

export default IngredientImageManager
