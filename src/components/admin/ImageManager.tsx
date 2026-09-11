import { useRef, useState } from 'react'
import { ArrowDown, ArrowUp, ImageOff, Loader2, RefreshCw, Star, Trash2, Upload } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { AdminRecipeImage } from '@/hooks/useRecipeImages'
import { useRecipeImages } from '@/hooks/useRecipeImages'
import { getRecipeImageUrl, validateRecipeImageFile } from '@/lib/storage'

interface ImageManagerProps {
  recipeId: string
}

interface PendingUpload {
  key: string
  file: File
  error: string | null
}

const inputClass =
  'rounded-control border border-border bg-surface-elevated px-2.5 py-1.5 text-sm text-foreground placeholder:text-muted-foreground'

function ImageManager({ recipeId }: ImageManagerProps) {
  const { t } = useTranslation()
  const { images, isLoading, addImage, replaceImage, removeImage, setPrimary, updateAlt, moveImage } =
    useRecipeImages(recipeId)
  const [pending, setPending] = useState<PendingUpload[]>([])
  const [rowErrors, setRowErrors] = useState<Record<string, string>>({})
  const [replacingIds, setReplacingIds] = useState<Set<string>>(new Set())
  const fileInputRef = useRef<HTMLInputElement>(null)

  const sorted = [...images].sort((a, b) => a.order_index - b.order_index)

  async function runUpload(key: string, file: File) {
    try {
      await addImage(file, '', '')
      setPending((prev) => prev.filter((p) => p.key !== key))
    } catch (err) {
      const message = err instanceof Error ? err.message : t('admin.recipeForm.imageErrors.uploadFailed')
      setPending((prev) => prev.map((p) => (p.key === key ? { ...p, error: message } : p)))
    }
  }

  async function handleFiles(files: FileList | null) {
    if (!files) return
    for (const file of Array.from(files)) {
      const key = `${Date.now()}-${file.name}-${Math.random()}`
      const validationError = validateRecipeImageFile(file)
      if (validationError) {
        setPending((prev) => [
          ...prev,
          { key, file, error: t(`admin.recipeForm.imageErrors.${validationError}`) },
        ])
        continue
      }
      setPending((prev) => [...prev, { key, file, error: null }])
      // Sequential, not parallel: order_index/primary assignment relies on
      // each upload completing (and the shared images list updating) before
      // the next one runs.
      await runUpload(key, file)
    }
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function retryUpload(item: PendingUpload) {
    setPending((prev) => prev.map((p) => (p.key === item.key ? { ...p, error: null } : p)))
    void runUpload(item.key, item.file)
  }

  function dismissPending(key: string) {
    setPending((prev) => prev.filter((p) => p.key !== key))
  }

  async function handleReplace(image: AdminRecipeImage, file: File | undefined) {
    if (!file) return
    setRowErrors((prev) => {
      const next = { ...prev }
      delete next[image.id]
      return next
    })

    const validationError = validateRecipeImageFile(file)
    if (validationError) {
      setRowErrors((prev) => ({ ...prev, [image.id]: t(`admin.recipeForm.imageErrors.${validationError}`) }))
      return
    }

    setReplacingIds((prev) => new Set(prev).add(image.id))
    try {
      await replaceImage(image, file)
    } catch (err) {
      const message = err instanceof Error ? err.message : t('admin.recipeForm.imageErrors.uploadFailed')
      setRowErrors((prev) => ({ ...prev, [image.id]: message }))
    } finally {
      setReplacingIds((prev) => {
        const next = new Set(prev)
        next.delete(image.id)
        return next
      })
    }
  }

  async function runAction(id: string, action: () => Promise<void>) {
    setRowErrors((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })
    try {
      await action()
    } catch (err) {
      const message = err instanceof Error ? err.message : t('admin.recipeForm.imageErrors.actionFailed')
      setRowErrors((prev) => ({ ...prev, [id]: message }))
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {isLoading && sorted.length === 0 && (
        <p className="text-sm text-muted-foreground">{t('admin.recipeForm.loadingImages')}</p>
      )}

      {sorted.map((image, index) => (
        <div
          key={image.id}
          className="flex flex-col gap-3 rounded-card border border-border bg-surface p-3 sm:flex-row"
        >
          <div className="relative aspect-video w-full shrink-0 overflow-hidden rounded-control bg-surface-elevated sm:w-40">
            <img
              src={getRecipeImageUrl(image.storage_path)}
              alt=""
              loading="lazy"
              decoding="async"
              className="size-full object-cover"
            />
            {image.is_primary && (
              <span className="absolute left-1.5 top-1.5 flex items-center gap-1 rounded-pill bg-accent px-1.5 py-0.5 text-[10px] font-semibold text-accent-foreground">
                <Star className="size-3" />
                {t('admin.recipeForm.primary')}
              </span>
            )}
            {replacingIds.has(image.id) && (
              <div className="absolute inset-0 flex items-center justify-center bg-surface/70">
                <Loader2 className="size-5 animate-spin text-foreground" />
              </div>
            )}
          </div>

          <div className="flex flex-1 flex-col gap-2">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <input
                defaultValue={image.alt_en}
                onBlur={(e) =>
                  void runAction(image.id, () => updateAlt(image.id, e.target.value, image.alt_sr))
                }
                placeholder={t('admin.recipeForm.altEn')}
                className={inputClass}
              />
              <input
                defaultValue={image.alt_sr}
                onBlur={(e) =>
                  void runAction(image.id, () => updateAlt(image.id, image.alt_en, e.target.value))
                }
                placeholder={t('admin.recipeForm.altSr')}
                className={inputClass}
              />
            </div>

            {rowErrors[image.id] && <p className="text-xs text-favorite">{rowErrors[image.id]}</p>}

            <div className="flex flex-wrap items-center gap-1">
              <button
                type="button"
                onClick={() => void runAction(image.id, () => setPrimary(image.id))}
                disabled={image.is_primary}
                className="flex items-center gap-1 rounded-control border border-border px-2 py-1 text-xs font-medium text-muted-foreground hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Star className="size-3.5" />
                {t('admin.recipeForm.setPrimary')}
              </button>
              <label className="flex cursor-pointer items-center gap-1 rounded-control border border-border px-2 py-1 text-xs font-medium text-muted-foreground hover:text-foreground">
                <RefreshCw className="size-3.5" />
                {t('admin.recipeForm.replaceImage')}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  disabled={replacingIds.has(image.id)}
                  onChange={(e) => {
                    void handleReplace(image, e.target.files?.[0])
                    e.target.value = ''
                  }}
                />
              </label>
              <button
                type="button"
                onClick={() => void runAction(image.id, () => moveImage(image.id, -1))}
                disabled={index === 0}
                aria-label={t('admin.recipeForm.moveUp')}
                className="flex size-7 items-center justify-center rounded-control border border-border text-muted-foreground hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ArrowUp className="size-3.5" />
              </button>
              <button
                type="button"
                onClick={() => void runAction(image.id, () => moveImage(image.id, 1))}
                disabled={index === sorted.length - 1}
                aria-label={t('admin.recipeForm.moveDown')}
                className="flex size-7 items-center justify-center rounded-control border border-border text-muted-foreground hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ArrowDown className="size-3.5" />
              </button>
              <button
                type="button"
                onClick={() => void runAction(image.id, () => removeImage(image))}
                aria-label={t('admin.recipeForm.remove')}
                className="flex size-7 items-center justify-center rounded-control border border-border text-favorite hover:bg-favorite/10"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          </div>
        </div>
      ))}

      {sorted.length === 0 && !isLoading && pending.length === 0 && (
        <div className="flex items-center gap-2 rounded-card border border-dashed border-border p-4 text-sm text-muted-foreground">
          <ImageOff className="size-4" />
          {t('admin.recipeForm.noImages')}
        </div>
      )}

      {pending.map((item) => (
        <div key={item.key} className="flex items-center gap-3 rounded-card border border-border bg-surface p-3">
          {item.error ? (
            <>
              <p className="flex-1 text-xs text-favorite">
                {item.file.name}: {item.error}
              </p>
              <button
                type="button"
                onClick={() => retryUpload(item)}
                className="rounded-control border border-border px-2 py-1 text-xs font-medium text-foreground hover:bg-surface-hover"
              >
                {t('admin.recipeForm.retryUpload')}
              </button>
              <button
                type="button"
                onClick={() => dismissPending(item.key)}
                aria-label={t('admin.recipeForm.remove')}
                className="flex size-7 items-center justify-center rounded-control border border-border text-favorite hover:bg-favorite/10"
              >
                <Trash2 className="size-3.5" />
              </button>
            </>
          ) : (
            <>
              <Loader2 className="size-4 shrink-0 animate-spin text-muted-foreground" />
              <p className="text-xs text-muted-foreground">{item.file.name}</p>
            </>
          )}
        </div>
      ))}

      <label className="flex cursor-pointer items-center justify-center gap-1.5 rounded-control border border-dashed border-border px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground">
        <Upload className="size-4" />
        {t('admin.recipeForm.addImage')}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={(e) => void handleFiles(e.target.files)}
        />
      </label>
    </div>
  )
}

export default ImageManager
