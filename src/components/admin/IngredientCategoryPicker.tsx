import { useMemo, useState } from 'react'
import { Check, Search } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useCurrentLang } from '@/hooks/useCurrentLang'
import { textMatchesQuery } from '@/lib/diacritics'
import { pickLocalized } from '@/lib/localizedField'
import { getIngredientCategoryColors, getIngredientCategoryIcon } from '@/lib/ingredientCategoryIcons'
import { cn } from '@/lib/utils'
import type { IngredientCategory } from '@/types/ingredient'

interface IngredientCategoryPickerProps {
  categories: IngredientCategory[]
  value: string
  onChange: (categoryId: string) => void
}

function IngredientCategoryPicker({ categories, value, onChange }: IngredientCategoryPickerProps) {
  const { t } = useTranslation()
  const lang = useCurrentLang()
  const [query, setQuery] = useState('')

  const visible = useMemo(() => {
    const trimmed = query.trim()
    if (!trimmed) return categories
    return categories.filter((category) => {
      const name = pickLocalized(category.name_en, category.name_sr, lang)
      return textMatchesQuery(name, trimmed) || textMatchesQuery(category.slug, trimmed)
    })
  }, [categories, query, lang])

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('admin.ingredients.categorySearchPlaceholder')}
          className="w-full rounded-control border border-border bg-surface-elevated py-2 pr-3 pl-8 text-sm text-foreground placeholder:text-muted-foreground"
        />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {visible.map((category) => {
          const Icon = getIngredientCategoryIcon(category.slug)
          const colors = getIngredientCategoryColors(category.slug)
          const active = value === category.id
          const description = t(`admin.ingredients.categoryDescriptions.${category.slug}`, { defaultValue: '' })

          return (
            <button
              key={category.id}
              type="button"
              onClick={() => onChange(active ? '' : category.id)}
              className={cn(
                'relative flex flex-col items-center gap-1.5 rounded-card border p-3 text-center transition-colors',
                active ? 'border-accent bg-accent-soft/40' : 'border-border bg-surface hover:border-accent/50',
              )}
            >
              {active && (
                <span className="absolute top-2 right-2 flex size-4 items-center justify-center rounded-full bg-accent text-accent-foreground">
                  <Check className="size-2.5" strokeWidth={3} />
                </span>
              )}
              <span className={cn('flex size-11 shrink-0 items-center justify-center rounded-full', colors.bgSoft, colors.text)}>
                <Icon className="size-5" />
              </span>
              <span className="text-sm font-semibold text-foreground">
                {pickLocalized(category.name_en, category.name_sr, lang)}
              </span>
              {description && <span className="line-clamp-2 text-xs text-muted-foreground">{description}</span>}
            </button>
          )
        })}
      </div>

      {visible.length === 0 && (
        <p className="text-sm text-muted-foreground">{t('admin.ingredients.categorySearchNoResults')}</p>
      )}
    </div>
  )
}

export default IngredientCategoryPicker
