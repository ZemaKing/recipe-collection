import { Check, ChevronDown, Gauge } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { getDifficultyColor } from '@/lib/difficultyColor'
import { difficultyValues } from '@/lib/recipeFormSchema'
import { cn } from '@/lib/utils'

type Difficulty = (typeof difficultyValues)[number]

interface DifficultySelectProps {
  value: string
  onChange: (value: Difficulty | '') => void
  placeholder: string
}

function DifficultySelect({ value, onChange, placeholder }: DifficultySelectProps) {
  const { t } = useTranslation()
  const selectedColor = getDifficultyColor(value)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex w-full items-center gap-2 rounded-control border border-border bg-surface-elevated px-2.5 py-2 text-sm text-foreground"
        >
          <Gauge className={cn('size-4 shrink-0', selectedColor)} />
          <span className="flex-1 truncate text-left">
            {value ? t(`recipeDetail.difficulty.${value}`) : placeholder}
          </span>
          <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[180px]">
        <DropdownMenuItem onSelect={() => onChange('')} className="gap-2">
          <Gauge className="size-4 shrink-0 text-muted-foreground" />
          <span className="flex-1 truncate">{placeholder}</span>
          {value === '' && <Check className="size-3.5 shrink-0 text-accent" />}
        </DropdownMenuItem>
        {difficultyValues.map((difficulty) => (
          <DropdownMenuItem key={difficulty} onSelect={() => onChange(difficulty)} className="gap-2">
            <Gauge className={cn('size-4 shrink-0', getDifficultyColor(difficulty))} />
            <span className="flex-1 truncate">{t(`recipeDetail.difficulty.${difficulty}`)}</span>
            {value === difficulty && <Check className="size-3.5 shrink-0 text-accent" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default DifficultySelect
