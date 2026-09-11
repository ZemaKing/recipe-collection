import RecipeImage from '@/components/recipes/RecipeImage'
import type { RecipeImageRef } from '@/types/recipe'

interface ImageGalleryProps {
  image: RecipeImageRef | null
  alt: string
}

// Only ever shows one image for now — none of the sample recipes have more
// than one photo yet, so gallery navigation (arrows/counter) is deferred
// until that's actually needed.
function ImageGallery({ image, alt }: ImageGalleryProps) {
  return <RecipeImage image={image} alt={alt} className="aspect-video w-full rounded-card" />
}

export default ImageGallery
