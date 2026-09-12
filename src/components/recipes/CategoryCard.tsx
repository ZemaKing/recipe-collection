import type { LucideIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useCurrentLang } from '@/hooks/useCurrentLang'
import { pickLocalized } from '@/lib/localizedField'
import { buildLocalizedPath } from '@/lib/localizedPath'

interface CategoryCardProps {
  slug: string
  name_en: string
  name_sr: string | null
  recipeCount: number
  icon: LucideIcon
}

function CategoryCard({ slug, name_en, name_sr, recipeCount, icon: Icon }: CategoryCardProps) {
  const { t } = useTranslation()
  const lang = useCurrentLang()
  const name = pickLocalized(name_en, name_sr, lang)

  return (
    <Link
      to={buildLocalizedPath(lang, `/kategorije/${slug}`)}
      className="flex items-center gap-3 rounded-card border border-border bg-surface px-3 py-2.5 text-left transition-colors hover:border-accent/50 sm:flex-col sm:gap-2 sm:p-4 sm:text-center"
    >
      <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
        <Icon className="size-6" />
      </div>
      <div className="flex min-w-0 flex-col sm:contents">
        <p className="line-clamp-2 text-sm font-semibold text-foreground">{name}</p>
        <p className="text-xs text-muted-foreground">{t('common.recipeCount', { count: recipeCount })}</p>
      </div>
    </Link>
  )
}

export default CategoryCard
