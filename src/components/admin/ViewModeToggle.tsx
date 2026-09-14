import { LayoutGrid, List } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'

export type ViewMode = 'grid' | 'list'

interface ViewModeToggleProps {
  value: ViewMode
  onChange: (mode: ViewMode) => void
}

function ViewModeToggle({ value, onChange }: ViewModeToggleProps) {
  const { t } = useTranslation()
  return (
    <div className="flex items-center overflow-hidden rounded-control border border-border">
      <button
        type="button"
        onClick={() => onChange('grid')}
        aria-label={t('admin.categories.gridView')}
        className={cn(
          'flex size-9 items-center justify-center',
          value === 'grid' ? 'bg-accent text-accent-foreground' : 'bg-surface-elevated text-muted-foreground hover:text-foreground',
        )}
      >
        <LayoutGrid className="size-4" />
      </button>
      <button
        type="button"
        onClick={() => onChange('list')}
        aria-label={t('admin.categories.listView')}
        className={cn(
          'flex size-9 items-center justify-center border-l border-border',
          value === 'list' ? 'bg-accent text-accent-foreground' : 'bg-surface-elevated text-muted-foreground hover:text-foreground',
        )}
      >
        <List className="size-4" />
      </button>
    </div>
  )
}

export default ViewModeToggle
