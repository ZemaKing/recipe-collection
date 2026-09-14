import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import CategorySelect from '@/components/admin/CategorySelect'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useCategories } from '@/hooks/useCategories'
import type { AdminSubcategory } from '@/hooks/useAdminSubcategories'
import { slugify } from '@/lib/slugify'

export type SubcategoryFormValues = {
  category_id: string
  slug: string
  name_en: string
  name_sr: string | null
}

interface SubcategoryFormDialogProps {
  subcategory: AdminSubcategory | null | undefined // undefined = closed, null = create, AdminSubcategory = edit
  isSaving: boolean
  error: string | null
  onSave: (values: SubcategoryFormValues) => void
  onOpenChange: (open: boolean) => void
}

function SubcategoryFormDialog({ subcategory, isSaving, error, onSave, onOpenChange }: SubcategoryFormDialogProps) {
  const open = subcategory !== undefined

  return (
    <Dialog open={open} onOpenChange={(next) => !isSaving && onOpenChange(next)}>
      <DialogContent>
        {open && (
          <SubcategoryForm
            key={subcategory?.id ?? 'create'}
            subcategory={subcategory}
            isSaving={isSaving}
            error={error}
            onSave={onSave}
            onCancel={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

interface SubcategoryFormProps {
  subcategory: AdminSubcategory | null
  isSaving: boolean
  error: string | null
  onSave: (values: SubcategoryFormValues) => void
  onCancel: () => void
}

function SubcategoryForm({ subcategory, isSaving, error, onSave, onCancel }: SubcategoryFormProps) {
  const { t } = useTranslation()
  const { categories } = useCategories()

  const [categoryId, setCategoryId] = useState(subcategory?.category_id ?? '')
  const [nameEn, setNameEn] = useState(subcategory?.name_en ?? '')
  const [nameSr, setNameSr] = useState(subcategory?.name_sr ?? '')
  const [slug, setSlug] = useState(subcategory?.slug ?? '')
  const [slugTouched, setSlugTouched] = useState(subcategory !== null)
  const [nameError, setNameError] = useState(false)
  const [slugError, setSlugError] = useState(false)
  const [categoryError, setCategoryError] = useState(false)

  function handleNameEnChange(value: string) {
    setNameEn(value)
    setNameError(false)
    if (!slugTouched) setSlug(slugify(value))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmedName = nameEn.trim()
    const trimmedSlug = slug.trim()
    if (!categoryId) {
      setCategoryError(true)
      return
    }
    if (!trimmedName) {
      setNameError(true)
      return
    }
    if (!trimmedSlug) {
      setSlugError(true)
      return
    }

    onSave({
      category_id: categoryId,
      slug: trimmedSlug,
      name_en: trimmedName,
      name_sr: nameSr.trim() || null,
    })
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>
          {subcategory ? t('admin.subcategories.editTitle') : t('admin.subcategories.createTitle')}
        </DialogTitle>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-foreground">{t('admin.subcategories.category')}</span>
          <CategorySelect
            categories={categories}
            value={categoryId}
            onChange={(nextCategoryId) => {
              setCategoryId(nextCategoryId)
              setCategoryError(false)
            }}
            hasError={categoryError}
            placeholder={t('admin.subcategories.selectCategory')}
            compact
          />
          {categoryError && <span className="text-xs text-favorite">{t('admin.subcategories.categoryRequired')}</span>}
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-foreground">{t('admin.categories.nameEn')}</span>
          <input
            value={nameEn}
            onChange={(e) => handleNameEnChange(e.target.value)}
            className={`rounded-control border bg-surface-elevated px-2.5 py-2 text-sm text-foreground ${
              nameError ? 'border-favorite' : 'border-border'
            }`}
          />
          {nameError && <span className="text-xs text-favorite">{t('admin.categories.nameRequired')}</span>}
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-foreground">{t('admin.categories.nameSr')}</span>
          <input
            value={nameSr}
            onChange={(e) => setNameSr(e.target.value)}
            className="rounded-control border border-border bg-surface-elevated px-2.5 py-2 text-sm text-foreground"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-foreground">{t('admin.categories.slug')}</span>
          <input
            value={slug}
            onChange={(e) => {
              setSlug(e.target.value)
              setSlugTouched(true)
              setSlugError(false)
            }}
            className={`rounded-control border bg-surface-elevated px-2.5 py-2 text-sm text-foreground ${
              slugError ? 'border-favorite' : 'border-border'
            }`}
          />
          {slugError && <span className="text-xs text-favorite">{t('admin.categories.slugRequired')}</span>}
        </label>

        {error && <p className="text-sm text-favorite">{error}</p>}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSaving}
            className="rounded-control border border-border px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            {t('admin.categories.cancel')}
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="rounded-control bg-accent px-3 py-2 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSaving ? t('admin.categories.saving') : t('admin.categories.save')}
          </button>
        </div>
      </form>
    </>
  )
}

export default SubcategoryFormDialog
