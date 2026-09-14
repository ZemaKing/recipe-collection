import { useState } from 'react'
import { ImageOff } from 'lucide-react'
import { getIngredientImageUrl } from '@/lib/storage'
import { cn } from '@/lib/utils'

interface IngredientImageProps {
  storagePath: string | null
  alt: string
  className?: string
}

// Same loading/error handling as RecipeImage, adapted for the single
// image_storage_path column on ingredients instead of a recipe_images ref.
function IngredientImage({ storagePath, alt, className }: IngredientImageProps) {
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>(storagePath ? 'loading' : 'error')

  if (!storagePath || status === 'error') {
    return (
      <div className={cn('flex items-center justify-center bg-surface-elevated text-muted-foreground', className)}>
        <ImageOff className="size-5" aria-label={alt} />
      </div>
    )
  }

  return (
    <div className={cn('relative overflow-hidden bg-surface-elevated', className)}>
      {status === 'loading' && <div className="absolute inset-0 animate-pulse bg-surface-hover" />}
      <img
        src={getIngredientImageUrl(storagePath)}
        alt={alt}
        loading="lazy"
        decoding="async"
        onLoad={() => setStatus('loaded')}
        onError={() => setStatus('error')}
        className={cn(
          'size-full object-cover transition-opacity duration-200',
          status === 'loading' ? 'opacity-0' : 'opacity-100',
        )}
      />
    </div>
  )
}

export default IngredientImage
