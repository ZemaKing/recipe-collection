import { useState } from 'react'
import { ImageOff } from 'lucide-react'
import { getRecipeImageUrl } from '@/lib/storage'
import { cn } from '@/lib/utils'
import type { RecipeImageRef } from '@/types/recipe'

interface RecipeImageProps {
  image: RecipeImageRef | null
  alt: string
  className?: string
  // Grid thumbnails should lazy-load; an above-the-fold hero (e.g. the
  // detail page gallery) should load eagerly so it doesn't delay LCP.
  loading?: 'lazy' | 'eager'
}

// Note: if this is reused for a recipe that can change without the component
// unmounting (e.g. the detail page's hero image across client-side nav
// between recipes), pass `key={image?.storage_path}` at the call site so the
// loading/error state resets instead of showing the previous recipe's image.
function RecipeImage({ image, alt, className, loading = 'lazy' }: RecipeImageProps) {
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>(image ? 'loading' : 'error')

  if (!image || status === 'error') {
    return (
      <div
        className={cn('flex items-center justify-center bg-surface-elevated text-muted-foreground', className)}
      >
        <ImageOff className="size-6" aria-label={alt} />
      </div>
    )
  }

  return (
    <div className={cn('relative overflow-hidden bg-surface-elevated', className)}>
      {status === 'loading' && <div className="absolute inset-0 animate-pulse bg-surface-hover" />}
      <img
        src={getRecipeImageUrl(image.storage_path)}
        alt={alt}
        loading={loading}
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

export default RecipeImage
