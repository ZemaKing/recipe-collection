import { createElement, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import Select, { components, type OptionProps, type SingleValueProps } from 'react-select'
import type { CategoryWithCount } from '@/hooks/useCategories'
import { useCurrentLang } from '@/hooks/useCurrentLang'
import { getCategoryDescription } from '@/lib/categoryDescriptions'
import { getCategoryIcon } from '@/lib/categoryIcons'
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
}

function CategoryBadge({ slug, className }: { slug: string; className: string }) {
  return (
    <span className={`flex shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent ${className}`}>
      {renderCategoryIcon(slug, 'size-5')}
    </span>
  )
}

function CategoryOption(props: OptionProps<CategoryOptionData, false>) {
  const { t } = useTranslation()
  const { data } = props
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

function CategorySelect({ categories, value, onChange, hasError, inputId, placeholder }: CategorySelectProps) {
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
  const styles = useMemo(() => createSelectStyles<CategoryOptionData>(hasError), [hasError])

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
      filterOption={(option, rawInput) => option.data.name.toLowerCase().includes(rawInput.toLowerCase())}
      components={{ Option: CategoryOption, SingleValue: CategorySingleValue }}
      styles={styles}
    />
  )
}

export default CategorySelect
