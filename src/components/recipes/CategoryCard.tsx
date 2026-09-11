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
      className="flex flex-col items-center gap-2 rounded-card border border-border bg-surface p-4 text-center transition-colors hover:border-accent/50"
    >
      <div className="flex size-12 items-center justify-center rounded-full bg-accent-soft text-accent">
        <Icon className="size-6" />
      </div>
      <p className="line-clamp-2 text-sm font-semibold text-foreground">{name}</p>
      <p className="text-xs text-muted-foreground">{t('common.recipeCount', { count: recipeCount })}</p>
    </Link>
  )
}

export default CategoryCard
