import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'

export type QuickFilter = 'all' | 'favorites' | 'recent' | 'topRated'

interface QuickFilterChipsProps {
  active: QuickFilter
  onChange: (filter: QuickFilter) => void
  totalCount: number
  favoriteCount: number
}

function QuickFilterChips({ active, onChange, totalCount, favoriteCount }: QuickFilterChipsProps) {
  const { t } = useTranslation()

  const filters: { id: QuickFilter; label: string; count?: number }[] = [
    { id: 'all', label: t('nav.allRecipes'), count: totalCount },
    { id: 'favorites', label: t('nav.favorites'), count: favoriteCount },
    { id: 'recent', label: t('nav.recentlyAdded') },
    { id: 'topRated', label: t('home.filters.topRated') },
  ]

  return (
    <div className="flex flex-wrap gap-2">
      {filters.map((filter) => (
        <button
          key={filter.id}
          type="button"
          onClick={() => onChange(filter.id)}
          className={cn(
            'rounded-pill border border-border px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground',
            active === filter.id && 'border-accent bg-accent-soft text-accent hover:text-accent',
          )}
        >
          {filter.label}
          {filter.count !== undefined && ` (${filter.count})`}
        </button>
      ))}
    </div>
  )
}

export default QuickFilterChips
