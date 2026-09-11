import { ImageOff } from 'lucide-react'
import { useTranslation } from 'react-i18next'

// Storage isn't wired until Phase 11, so this always renders the
// missing-image placeholder for now rather than a real gallery.
function ImageGallery() {
  const { t } = useTranslation()

  return (
    <div className="flex aspect-video w-full items-center justify-center rounded-card bg-surface-elevated text-muted-foreground">
      <ImageOff className="size-10" aria-label={t('recipeCard.noImage')} />
    </div>
  )
}

export default ImageGallery
