import { Check, ChevronDown, Tag } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { pickLocalized } from '@/lib/localizedField'

interface SubcategoryFilterOption {
  id: string
  slug: string
  name_en: string
  name_sr: string | null
}

interface SubcategoryFilterSelectProps {
  subcategories: SubcategoryFilterOption[]
  value: string | null
  onChange: (slug: string | null) => void
  lang: 'en' | 'sr'
  allLabel: string
}

function SubcategoryFilterSelect({ subcategories, value, onChange, lang, allLabel }: SubcategoryFilterSelectProps) {
  const selected = subcategories.find((subcategory) => subcategory.slug === value) ?? null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex min-w-[160px] items-center gap-2 rounded-control border border-border bg-surface-elevated px-3 py-2 text-sm text-foreground"
        >
          <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
            <Tag className="size-3.5" />
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
            <Tag className="size-3.5" />
          </span>
          <span className="flex-1 truncate">{allLabel}</span>
          {value === null && <Check className="size-3.5 shrink-0 text-accent" />}
        </DropdownMenuItem>
        {subcategories.map((subcategory) => {
          const isSelected = subcategory.slug === value
          return (
            <DropdownMenuItem key={subcategory.id} onSelect={() => onChange(subcategory.slug)} className="gap-2">
              <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
                <Tag className="size-3.5" />
              </span>
              <span className="flex-1 truncate">{pickLocalized(subcategory.name_en, subcategory.name_sr, lang)}</span>
              {isSelected && <Check className="size-3.5 shrink-0 text-accent" />}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default SubcategoryFilterSelect
