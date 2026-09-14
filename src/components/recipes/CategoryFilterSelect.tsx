import { Check, ChevronDown, LayoutGrid } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { getCategoryBadgeColor } from '@/lib/categoryColor'
import { getCategoryIcon } from '@/lib/categoryIcons'
import { pickLocalized } from '@/lib/localizedField'

interface CategoryFilterOption {
  id: string
  slug: string
  name_en: string
  name_sr: string | null
}

interface CategoryFilterSelectProps {
  categories: CategoryFilterOption[]
  value: string | null
  onChange: (slug: string | null) => void
  lang: 'en' | 'sr'
  allLabel: string
}

function CategoryFilterSelect({ categories, value, onChange, lang, allLabel }: CategoryFilterSelectProps) {
  const selected = categories.find((category) => category.slug === value) ?? null
  const selectedColors = selected ? getCategoryBadgeColor(selected.slug) : null
  const selectedIconNode = categories
    .filter((category) => category.slug === value)
    .map((category) => {
      const Icon = getCategoryIcon(category.slug)
      return <Icon key={category.id} className="size-3.5" />
    })[0] ?? <LayoutGrid className="size-3.5" />

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex min-w-[160px] items-center gap-2 rounded-control border border-border bg-surface-elevated px-3 py-2 text-sm text-foreground"
        >
          <span
            className={`flex size-5 shrink-0 items-center justify-center rounded-full ${selectedColors ? selectedColors.bg : 'bg-accent-soft'} ${selectedColors ? selectedColors.text : 'text-accent'}`}
          >
            {selectedIconNode}
          </span>
          <span className="flex-1 truncate text-left">
            {selected ? pickLocalized(selected.name_en, selected.name_sr, lang) : allLabel}
          </span>
          <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="max-h-80 min-w-[220px] overflow-y-auto">
        <DropdownMenuItem onSelect={() => onChange(null)} className="gap-2">
          <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
            <LayoutGrid className="size-3.5" />
          </span>
          <span className="flex-1 truncate">{allLabel}</span>
          {value === null && <Check className="size-3.5 shrink-0 text-accent" />}
        </DropdownMenuItem>
        {categories.map((category) => {
          const Icon = getCategoryIcon(category.slug)
          const colors = getCategoryBadgeColor(category.slug)
          const isSelected = category.slug === value
          return (
            <DropdownMenuItem key={category.id} onSelect={() => onChange(category.slug)} className="gap-2">
              <span className={`flex size-5 shrink-0 items-center justify-center rounded-full ${colors.bg} ${colors.text}`}>
                <Icon className="size-3.5" />
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

export default CategoryFilterSelect
