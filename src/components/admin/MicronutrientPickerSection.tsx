import { useState } from 'react'
import { Search, Trash2 } from 'lucide-react'
import { pickLocalized } from '@/lib/localizedField'

export interface MicronutrientCatalogEntry {
  id: string
  code: string
  name_en: string
  name_sr: string
  unit: string
}

export interface MicronutrientPickerRow {
  id: string
  amount: string
}

interface MicronutrientPickerSectionProps {
  label: string
  addPlaceholder: string
  catalog: MicronutrientCatalogEntry[]
  entriesById: Map<string, MicronutrientCatalogEntry>
  rows: MicronutrientPickerRow[]
  lang: 'en' | 'sr'
  errorFor: (index: number) => string | undefined
  onAdd: (id: string) => void
  onChangeAmount: (index: number, amount: string) => void
  onRemove: (index: number) => void
}

const inputClass =
  'rounded-control border border-border bg-surface-elevated px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground'
const labelClass = 'text-sm font-medium text-foreground'

function MicronutrientPickerSection({
  label,
  addPlaceholder,
  catalog,
  entriesById,
  rows,
  lang,
  errorFor,
  onAdd,
  onChangeAmount,
  onRemove,
}: MicronutrientPickerSectionProps) {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)

  const normalizedQuery = query.trim().toLowerCase()
  const suggestions =
    isOpen && normalizedQuery.length > 0
      ? catalog
          .filter(
            (entry) =>
              entry.name_en.toLowerCase().includes(normalizedQuery) ||
              entry.name_sr.toLowerCase().includes(normalizedQuery) ||
              entry.code.toLowerCase().includes(normalizedQuery),
          )
          .slice(0, 8)
      : []

  return (
    <div className="flex flex-col gap-2">
      <span className={labelClass}>{label}</span>

      {rows.map((row, index) => {
        const entry = entriesById.get(row.id)
        if (!entry) return null
        return (
          <div
            key={row.id}
            className="flex flex-wrap items-center gap-2 rounded-control border border-border bg-surface-elevated px-3 py-2"
          >
            <span className="min-w-0 flex-1 truncate text-sm text-foreground">
              {pickLocalized(entry.name_en, entry.name_sr, lang)} ({entry.code})
            </span>
            <div className="flex items-center gap-2">
              <div>
                <input
                  value={row.amount}
                  onChange={(e) => onChangeAmount(index, e.target.value)}
                  inputMode="decimal"
                  className={`${inputClass} w-20`}
                />
                {errorFor(index) && <p className="mt-1 text-xs text-favorite">{errorFor(index)}</p>}
              </div>
              <span className="text-xs text-muted-foreground">{entry.unit}</span>
              <button
                type="button"
                onClick={() => onRemove(index)}
                aria-label="Remove"
                className="flex size-9 items-center justify-center rounded-control border border-border text-favorite hover:bg-favorite/10"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          </div>
        )
      })}

      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setIsOpen(true)
          }}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 150)}
          placeholder={addPlaceholder}
          autoComplete="off"
          className={`${inputClass} w-full pl-8`}
        />

        {suggestions.length > 0 && (
          <ul className="absolute top-full left-0 z-20 mt-1 w-full max-w-sm overflow-hidden rounded-control border border-border bg-surface-elevated shadow-xl">
            {suggestions.map((entry) => (
              <li key={entry.id}>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    onAdd(entry.id)
                    setQuery('')
                    setIsOpen(false)
                  }}
                  className="flex w-full items-center px-3 py-2 text-left text-sm hover:bg-surface-hover"
                >
                  {pickLocalized(entry.name_en, entry.name_sr, lang)} ({entry.code})
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

export default MicronutrientPickerSection
