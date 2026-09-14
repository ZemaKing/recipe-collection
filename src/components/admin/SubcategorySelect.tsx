import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import Select, { components, type OptionProps, type SingleValueProps } from 'react-select'
import type { SubcategoryWithCount } from '@/hooks/useSubcategories'
import { createSelectStyles } from '@/lib/selectStyles'

interface SubcategoryOptionData {
  value: string
  nameEn: string
  nameSr: string | null
  recipeCount: number
}

interface SubcategorySelectProps {
  subcategories: SubcategoryWithCount[]
  value: string
  onChange: (subcategoryId: string) => void
  isDisabled?: boolean
  inputId?: string
  placeholder: string
}

function SubcategoryOption(props: OptionProps<SubcategoryOptionData, false>) {
  const { t } = useTranslation()
  const { data } = props
  return (
    <components.Option {...props}>
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground">{data.nameEn}</p>
          {data.nameSr && <p className="truncate text-xs text-muted-foreground">{data.nameSr}</p>}
        </div>
        <span className="shrink-0 rounded-pill bg-surface px-2 py-0.5 text-xs text-muted-foreground">
          {t('common.recipeCount', { count: data.recipeCount })}
        </span>
      </div>
    </components.Option>
  )
}

function SubcategorySingleValue(props: SingleValueProps<SubcategoryOptionData, false>) {
  const { data } = props
  return <components.SingleValue {...props}>{data.nameEn}</components.SingleValue>
}

function SubcategorySelect({
  subcategories,
  value,
  onChange,
  isDisabled,
  inputId,
  placeholder,
}: SubcategorySelectProps) {
  const { t } = useTranslation()

  const options = useMemo<SubcategoryOptionData[]>(
    () =>
      subcategories.map((subcategory) => ({
        value: subcategory.id,
        nameEn: subcategory.name_en,
        nameSr: subcategory.name_sr,
        recipeCount: subcategory.recipeCount,
      })),
    [subcategories],
  )

  const selected = options.find((option) => option.value === value) ?? null
  const styles = useMemo(() => createSelectStyles<SubcategoryOptionData>(false), [])

  return (
    <Select<SubcategoryOptionData>
      inputId={inputId}
      classNamePrefix="rselect"
      options={options}
      value={selected}
      onChange={(option) => onChange(option?.value ?? '')}
      isClearable
      isSearchable
      isDisabled={isDisabled}
      placeholder={placeholder}
      noOptionsMessage={() => t('admin.recipeForm.noOptions')}
      filterOption={(option, rawInput) => {
        const query = rawInput.toLowerCase()
        return (
          option.data.nameEn.toLowerCase().includes(query) ||
          (option.data.nameSr?.toLowerCase().includes(query) ?? false)
        )
      }}
      components={{ Option: SubcategoryOption, SingleValue: SubcategorySingleValue }}
      styles={styles}
    />
  )
}

export default SubcategorySelect
