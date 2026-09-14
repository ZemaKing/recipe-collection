import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import Select from 'react-select'
import type { SubcategoryWithCount } from '@/hooks/useSubcategories'
import { useCurrentLang } from '@/hooks/useCurrentLang'
import { textMatchesQuery } from '@/lib/diacritics'
import { pickLocalized } from '@/lib/localizedField'
import { createSelectStyles } from '@/lib/selectStyles'

interface SubcategoryOptionData {
  value: string
  label: string
}

interface SubcategorySelectProps {
  subcategories: SubcategoryWithCount[]
  value: string
  onChange: (subcategoryId: string) => void
  isDisabled?: boolean
  inputId?: string
  placeholder: string
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
  const lang = useCurrentLang()

  const options = useMemo<SubcategoryOptionData[]>(
    () =>
      subcategories.map((subcategory) => ({
        value: subcategory.id,
        label: pickLocalized(subcategory.name_en, subcategory.name_sr, lang),
      })),
    [subcategories, lang],
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
      filterOption={(option, rawInput) => textMatchesQuery(option.data.label, rawInput)}
      styles={styles}
    />
  )
}

export default SubcategorySelect
