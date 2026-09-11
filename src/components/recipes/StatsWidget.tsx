import { useTranslation } from 'react-i18next'
import type { RecipeStats } from '@/hooks/useRecipeStats'

interface StatsWidgetProps {
  stats: RecipeStats
}

function StatsWidget({ stats }: StatsWidgetProps) {
  const { t } = useTranslation()

  const items: { key: keyof RecipeStats; label: string }[] = [
    { key: 'recipeCount', label: t('home.stats.recipes') },
    { key: 'categoryCount', label: t('nav.categories') },
    { key: 'favoriteCount', label: t('nav.favorites') },
    { key: 'noteCount', label: t('nav.kitchenNotes') },
  ]

  return (
    <div className="rounded-card border border-border bg-surface p-4">
      <p className="mb-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        {t('home.stats.title')}
      </p>
      <div className="grid grid-cols-2 gap-4">
        {items.map((item) => (
          <div key={item.key}>
            <p className="text-2xl font-semibold text-foreground">{stats[item.key]}</p>
            <p className="text-xs text-muted-foreground">{item.label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default StatsWidget
