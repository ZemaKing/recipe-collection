import { createElement, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import Select, { components, type OptionProps, type SingleValueProps } from 'react-select'
import type { CategoryWithCount } from '@/hooks/useCategories'
import { useCurrentLang } from '@/hooks/useCurrentLang'
import { getCategoryBadgeColor } from '@/lib/categoryColor'
import { getCategoryDescription } from '@/lib/categoryDescriptions'
import { getCategoryIcon } from '@/lib/categoryIcons'
import { textMatchesQuery } from '@/lib/diacritics'
import { pickLocalized } from '@/lib/localizedField'
import { createSelectStyles } from '@/lib/selectStyles'

// A plain (lowercase, non-component) helper so the icon lookup doesn't read
// as "creating a component during render" to eslint-plugin-react-hooks —
// it returns an element via createElement instead of a JSX `<Icon />` tag.
function renderCategoryIcon(slug: string, className: string) {
  return createElement(getCategoryIcon(slug), { className })
}

interface CategoryOptionData {
  value: string
  slug: string
  name: string
  description: string | null
  recipeCount: number
}

interface CategorySelectProps {
  categories: CategoryWithCount[]
  value: string
  onChange: (categoryId: string) => void
  hasError?: boolean
  inputId?: string
  placeholder: string
  // Compact mode drops the recipe-count pill and description line (used in
  // small contexts like the subcategory dialog) so options are short enough
  // that the menu doesn't need its own scrollbar inside an already-scrolling
  // dialog.
  compact?: boolean
}

function CategoryBadge({ slug, className }: { slug: string; className: string }) {
  const colors = getCategoryBadgeColor(slug)
  return (
    <span className={`flex shrink-0 items-center justify-center rounded-full ${colors.bg} ${colors.text} ${className}`}>
      {renderCategoryIcon(slug, 'size-5')}
    </span>
  )
}

function CategoryOption(props: OptionProps<CategoryOptionData, false> & { selectProps: { compact?: boolean } }) {
  const { t } = useTranslation()
  const { data, selectProps } = props
  const compact = selectProps.compact

  if (compact) {
    return (
      <components.Option {...props}>
        <div className="flex items-center gap-2.5">
          <CategoryBadge slug={data.slug} className="size-8" />
          <p className="truncate text-sm font-medium text-foreground">{data.name}</p>
        </div>
      </components.Option>
    )
  }

  return (
    <components.Option {...props}>
      <div className="flex items-center gap-3">
        <CategoryBadge slug={data.slug} className="size-11" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-sm font-semibold text-foreground">{data.name}</p>
            <span className="shrink-0 rounded-pill bg-surface px-2 py-0.5 text-xs text-muted-foreground">
              {t('common.recipeCount', { count: data.recipeCount })}
            </span>
          </div>
          {data.description && <p className="truncate text-xs text-muted-foreground">{data.description}</p>}
        </div>
      </div>
    </components.Option>
  )
}

function CategorySingleValue(props: SingleValueProps<CategoryOptionData, false>) {
  const { data } = props
  return (
    <components.SingleValue {...props}>
      <div className="flex items-center gap-2">
        <CategoryBadge slug={data.slug} className="size-6" />
        <span className="truncate text-sm text-foreground">{data.name}</span>
      </div>
    </components.SingleValue>
  )
}

function CategorySelect({ categories, value, onChange, hasError, inputId, placeholder, compact }: CategorySelectProps) {
  const { t } = useTranslation()
  const lang = useCurrentLang()

  const options = useMemo<CategoryOptionData[]>(
    () =>
      categories.map((category) => ({
        value: category.id,
        slug: category.slug,
        name: pickLocalized(category.name_en, category.name_sr, lang),
        description: getCategoryDescription(category.slug, lang),
        recipeCount: category.recipeCount,
      })),
    [categories, lang],
  )

  const selected = options.find((option) => option.value === value) ?? null
  // Compact rows are ~48px tall — cap the menu at 5 visible rows so longer
  // category lists scroll instead of growing the dialog taller.
  const styles = useMemo(
    () => createSelectStyles<CategoryOptionData>(hasError, compact ? 256 : undefined),
    [hasError, compact],
  )

  return (
    <Select<CategoryOptionData>
      inputId={inputId}
      classNamePrefix="rselect"
      options={options}
      value={selected}
      onChange={(option) => onChange(option?.value ?? '')}
      isClearable={false}
      isSearchable
      placeholder={placeholder}
      noOptionsMessage={() => t('admin.recipeForm.noOptions')}
      filterOption={(option, rawInput) => textMatchesQuery(option.data.name, rawInput)}
      components={{ Option: CategoryOption, SingleValue: CategorySingleValue }}
      styles={styles}
      // @ts-expect-error -- custom prop forwarded to Option via selectProps
      compact={compact}
    />
  )
}

export default CategorySelect
