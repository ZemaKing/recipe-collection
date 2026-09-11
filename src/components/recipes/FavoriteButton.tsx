import { Heart } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'

interface FavoriteButtonProps {
  isFavorite: boolean
  // Omitted when the viewer isn't authorized to edit favorites — renders a
  // read-only indicator instead of a button.
  onToggle?: () => void
  size?: 'sm' | 'md'
  className?: string
}

function FavoriteButton({ isFavorite, onToggle, size = 'md', className }: FavoriteButtonProps) {
  const { t } = useTranslation()
  const heart = (
    <Heart
      className={cn(size === 'sm' ? 'size-4' : 'size-6', isFavorite ? 'fill-favorite text-favorite' : 'text-muted-foreground')}
    />
  )

  if (!onToggle) {
    return (
      <span className={className} aria-label={isFavorite ? t('recipeDetail.favorited') : t('recipeDetail.notFavorited')}>
        {heart}
      </span>
    )
  }

  return (
    <button
      type="button"
      onClick={(event) => {
        event.preventDefault()
        event.stopPropagation()
        onToggle()
      }}
      aria-pressed={isFavorite}
      aria-label={isFavorite ? t('recipeDetail.removeFavorite') : t('recipeDetail.addFavorite')}
      className={cn('flex items-center justify-center transition-transform active:scale-90', className)}
    >
      {heart}
    </button>
  )
}

export default FavoriteButton
