import { Check, ChevronDown, Tag } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { getIngredientCategoryColors, getIngredientCategoryIcon } from '@/lib/ingredientCategoryIcons'
import { pickLocalized } from '@/lib/localizedField'

interface IngredientCategoryOption {
  id: string
  slug: string
  name_en: string
  name_sr: string | null
}

interface IngredientCategoryFilterProps {
  categories: IngredientCategoryOption[]
  value: string
  onChange: (categoryId: string) => void
  lang: 'en' | 'sr'
  allLabel: string
}

function IngredientCategoryFilter({ categories, value, onChange, lang, allLabel }: IngredientCategoryFilterProps) {
  const selected = categories.find((category) => category.id === value) ?? null
  const selectedColors = selected ? getIngredientCategoryColors(selected.slug) : null
  const selectedIconNode = categories
    .filter((category) => category.id === value)
    .map((category) => {
      const Icon = getIngredientCategoryIcon(category.slug)
      return <Icon key={category.id} className="size-3" />
    })[0] ?? <Tag className="size-3" />

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex min-w-[200px] items-center gap-2 rounded-control border border-border bg-surface-elevated px-2.5 py-1.5 text-sm text-foreground"
        >
          <span
            className={`flex size-5 shrink-0 items-center justify-center rounded-full ${selectedColors ? selectedColors.bgSoft : 'bg-accent-soft'} ${selectedColors ? selectedColors.text : 'text-accent'}`}
          >
            {selectedIconNode}
          </span>
          <span className="flex-1 truncate text-left">
            {selected ? pickLocalized(selected.name_en, selected.name_sr, lang) : allLabel}
          </span>
          <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="max-h-80 min-w-[240px] overflow-y-auto">
        <DropdownMenuItem onSelect={() => onChange('')} className="gap-2">
          <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
            <Tag className="size-3" />
          </span>
          <span className="flex-1 truncate">{allLabel}</span>
          {value === '' && <Check className="size-3.5 shrink-0 text-accent" />}
        </DropdownMenuItem>
        {categories.map((category) => {
          const Icon = getIngredientCategoryIcon(category.slug)
          const colors = getIngredientCategoryColors(category.slug)
          const isSelected = category.id === value
          return (
            <DropdownMenuItem key={category.id} onSelect={() => onChange(category.id)} className="gap-2">
              <span className={`flex size-5 shrink-0 items-center justify-center rounded-full ${colors.bgSoft} ${colors.text}`}>
                <Icon className="size-3" />
              </span>
              <span className="flex-1 truncate">{pickLocalized(category.name_en, category.name_sr, lang)}</span>
              {isSelected && <Check className="size-3.5 shrink-0 text-accent" />}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default IngredientCategoryFilter
