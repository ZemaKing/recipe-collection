import { useState } from 'react'
import { ImageOff } from 'lucide-react'
import { getRecipeImageUrls } from '@/lib/storage'
import { cn } from '@/lib/utils'
import type { RecipeImageRef } from '@/types/recipe'

interface RecipeImageProps {
  image: RecipeImageRef | null
  alt: string
  className?: string
  // Lists show the small thumbnail; only the detail hero needs the full image.
  variant?: 'thumb' | 'full'
  // Grid thumbnails should lazy-load; an above-the-fold hero (e.g. the
  // detail page gallery) or the first row of a grid should load eagerly so
  // it doesn't delay LCP.
  loading?: 'lazy' | 'eager'
  fetchPriority?: 'high' | 'low' | 'auto'
}

// Note: if this is reused for a recipe that can change without the component
// unmounting (e.g. the detail page's hero image across client-side nav
// between recipes), pass `key={image?.storage_path}` at the call site so the
// loading/error state resets instead of showing the previous recipe's image.
function RecipeImage({
  image,
  alt,
  className,
  variant = 'thumb',
  loading = 'lazy',
  fetchPriority,
}: RecipeImageProps) {
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>(image ? 'loading' : 'error')

  if (!image || status === 'error') {
    return (
      <div
        className={cn(
          'flex items-center justify-center bg-surface-elevated text-muted-foreground',
          className,
        )}
      >
        <ImageOff className="size-6" aria-label={alt} />
      </div>
    )
  }

  return (
    <div className={cn('relative overflow-hidden bg-surface-elevated', className)}>
      {status === 'loading' && <div className="absolute inset-0 animate-pulse bg-surface-hover" />}
      <img
        src={getRecipeImageUrls(image)[variant]}
        alt={alt}
        // Intrinsic size of the full image; the thumb has the same aspect ratio.
        width={image.width ?? undefined}
        height={image.height ?? undefined}
        loading={loading}
        fetchPriority={fetchPriority}
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
