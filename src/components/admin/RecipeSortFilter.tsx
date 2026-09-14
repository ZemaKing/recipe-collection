import { ArrowDownAZ, Check, ChevronDown, Clock, Star, type LucideIcon } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { AdminRecipeSort } from '@/hooks/useAdminRecipes'

interface SortOption {
  value: AdminRecipeSort
  icon: LucideIcon
  bg: string
  text: string
}

const SORT_OPTIONS: SortOption[] = [
  { value: 'name', icon: ArrowDownAZ, bg: 'bg-sky-500/15', text: 'text-sky-400' },
  { value: 'rating', icon: Star, bg: 'bg-amber-500/15', text: 'text-amber-400' },
  { value: 'recent', icon: Clock, bg: 'bg-emerald-500/15', text: 'text-emerald-400' },
]

interface RecipeSortFilterProps {
  value: AdminRecipeSort
  onChange: (sort: AdminRecipeSort) => void
  labels: Record<AdminRecipeSort, string>
}

function RecipeSortFilter({ value, onChange, labels }: RecipeSortFilterProps) {
  const selected = SORT_OPTIONS.find((option) => option.value === value) ?? SORT_OPTIONS[0]
  const SelectedIcon = selected.icon

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex min-w-[180px] items-center gap-2 rounded-control border border-border bg-surface-elevated px-2.5 py-1.5 text-sm text-foreground"
        >
          <span className={`flex size-5 shrink-0 items-center justify-center rounded-full ${selected.bg} ${selected.text}`}>
            <SelectedIcon className="size-3" />
          </span>
          <span className="flex-1 truncate text-left">{labels[selected.value]}</span>
          <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[200px]">
        {SORT_OPTIONS.map((option) => {
          const Icon = option.icon
          const isSelected = option.value === value
          return (
            <DropdownMenuItem key={option.value} onSelect={() => onChange(option.value)} className="gap-2">
              <span className={`flex size-5 shrink-0 items-center justify-center rounded-full ${option.bg} ${option.text}`}>
                <Icon className="size-3" />
              </span>
              <span className="flex-1 truncate">{labels[option.value]}</span>
              {isSelected && <Check className="size-3.5 shrink-0 text-accent" />}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default RecipeSortFilter
