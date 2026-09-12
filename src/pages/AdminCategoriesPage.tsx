import { useState } from 'react'
import { LayoutGrid, Plus, Tag as TagIcon, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import CategoryFormDialog, { type CategoryFormValues } from '@/components/admin/CategoryFormDialog'
import DeleteCategoryDialog from '@/components/admin/DeleteCategoryDialog'
import DeleteTagDialog from '@/components/admin/DeleteTagDialog'
import TagFormDialog, { type TagFormValues } from '@/components/admin/TagFormDialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import EmptyState from '@/components/ui/EmptyState'
import { useAdminCategories, type AdminCategory } from '@/hooks/useAdminCategories'
import { useAdminTags, type AdminTag } from '@/hooks/useAdminTags'
import { useCurrentLang } from '@/hooks/useCurrentLang'
import { useDeleteCategory } from '@/hooks/useDeleteCategory'
import { useDeleteTag } from '@/hooks/useDeleteTag'
import { useSaveCategory } from '@/hooks/useSaveCategory'
import { useSaveTag } from '@/hooks/useSaveTag'
import { pickLocalized } from '@/lib/localizedField'

function AdminCategoriesPage() {
  const { t } = useTranslation()
  const lang = useCurrentLang()

  const { categories, isLoading: categoriesLoading, error: categoriesLoadError, refetch: refetchCategories } =
    useAdminCategories()
  const { saveCategory, isSaving: isSavingCategory, error: saveCategoryError } = useSaveCategory()
  const { deleteCategory, isDeleting: isDeletingCategory, error: deleteCategoryError } = useDeleteCategory()

  const { tags, isLoading: tagsLoading, error: tagsLoadError, refetch: refetchTags } = useAdminTags()
  const { saveTag, isSaving: isSavingTag, error: saveTagError } = useSaveTag()
  const { deleteTag, isDeleting: isDeletingTag, error: deleteTagError } = useDeleteTag()

  const [editingCategory, setEditingCategory] = useState<AdminCategory | null | undefined>(undefined)
  const [pendingDeleteCategory, setPendingDeleteCategory] = useState<AdminCategory | null>(null)

  const [editingTag, setEditingTag] = useState<AdminTag | null | undefined>(undefined)
  const [pendingDeleteTag, setPendingDeleteTag] = useState<AdminTag | null>(null)

  async function handleSaveCategory(values: CategoryFormValues) {
    await saveCategory({ id: editingCategory?.id, ...values })
    setEditingCategory(undefined)
    refetchCategories()
  }

  async function handleConfirmDeleteCategory() {
    if (!pendingDeleteCategory) return
    await deleteCategory(pendingDeleteCategory.id)
    setPendingDeleteCategory(null)
    refetchCategories()
  }

  async function handleSaveTag(values: TagFormValues) {
    await saveTag({ id: editingTag?.id, ...values })
    setEditingTag(undefined)
    refetchTags()
  }

  async function handleConfirmDeleteTag() {
    if (!pendingDeleteTag) return
    await deleteTag(pendingDeleteTag.id)
    setPendingDeleteTag(null)
    refetchTags()
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">{t('admin.nav.categories')}</h1>

      <Tabs defaultValue="categories">
        <TabsList>
          <TabsTrigger value="categories">{t('admin.categories.categoriesTab')}</TabsTrigger>
          <TabsTrigger value="tags">{t('admin.categories.tagsTab')}</TabsTrigger>
        </TabsList>

        <TabsContent value="categories" className="flex flex-col gap-4">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setEditingCategory(null)}
              className="flex items-center gap-1.5 rounded-control bg-accent px-3 py-2 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent-hover"
            >
              <Plus className="size-4" />
              {t('admin.categories.addCategory')}
            </button>
          </div>

          {categoriesLoadError && <p className="text-sm text-favorite">{categoriesLoadError}</p>}

          {!categoriesLoading && categories.length === 0 && (
            <EmptyState icon={LayoutGrid} title={t('admin.categories.emptyCategoriesTitle')} />
          )}

          {categories.length > 0 && (
            <div className="flex flex-col divide-y divide-border rounded-card border border-border bg-surface">
              {categories.map((category) => (
                <div key={category.id} className="flex items-center gap-2 px-4 py-3 text-sm">
                  <button
                    type="button"
                    onClick={() => setEditingCategory(category)}
                    className="flex flex-1 items-center justify-between gap-2 text-left transition-colors hover:text-accent"
                  >
                    <span className="font-medium text-foreground">
                      {pickLocalized(category.name_en, category.name_sr, lang)}
                    </span>
                    <span className="text-muted-foreground">{category.slug}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPendingDeleteCategory(category)}
                    aria-label={t('admin.categories.delete')}
                    className="flex size-8 shrink-0 items-center justify-center rounded-control border border-border text-favorite hover:bg-favorite/10"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="tags" className="flex flex-col gap-4">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setEditingTag(null)}
              className="flex items-center gap-1.5 rounded-control bg-accent px-3 py-2 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent-hover"
            >
              <Plus className="size-4" />
              {t('admin.categories.addTag')}
            </button>
          </div>

          {tagsLoadError && <p className="text-sm text-favorite">{tagsLoadError}</p>}

          {!tagsLoading && tags.length === 0 && (
            <EmptyState icon={TagIcon} title={t('admin.categories.emptyTagsTitle')} />
          )}

          {tags.length > 0 && (
            <div className="flex flex-col divide-y divide-border rounded-card border border-border bg-surface">
              {tags.map((tag) => (
                <div key={tag.id} className="flex items-center gap-2 px-4 py-3 text-sm">
                  <button
                    type="button"
                    onClick={() => setEditingTag(tag)}
                    className="flex flex-1 items-center justify-between gap-2 text-left transition-colors hover:text-accent"
                  >
                    <span className="font-medium text-foreground">{pickLocalized(tag.name_en, tag.name_sr, lang)}</span>
                    <span className="text-muted-foreground">{tag.slug}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPendingDeleteTag(tag)}
                    aria-label={t('admin.categories.delete')}
                    className="flex size-8 shrink-0 items-center justify-center rounded-control border border-border text-favorite hover:bg-favorite/10"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <CategoryFormDialog
        category={editingCategory}
        isSaving={isSavingCategory}
        error={saveCategoryError}
        onSave={(values) => void handleSaveCategory(values)}
        onOpenChange={(open) => !open && setEditingCategory(undefined)}
      />

      <DeleteCategoryDialog
        categoryName={
          pendingDeleteCategory ? pickLocalized(pendingDeleteCategory.name_en, pendingDeleteCategory.name_sr, lang) : null
        }
        isDeleting={isDeletingCategory}
        error={deleteCategoryError}
        onConfirm={() => void handleConfirmDeleteCategory()}
        onOpenChange={(open) => !open && setPendingDeleteCategory(null)}
      />

      <TagFormDialog
        tag={editingTag}
        isSaving={isSavingTag}
        error={saveTagError}
        onSave={(values) => void handleSaveTag(values)}
        onOpenChange={(open) => !open && setEditingTag(undefined)}
      />

      <DeleteTagDialog
        tagName={pendingDeleteTag ? pickLocalized(pendingDeleteTag.name_en, pendingDeleteTag.name_sr, lang) : null}
        isDeleting={isDeletingTag}
        error={deleteTagError}
        onConfirm={() => void handleConfirmDeleteTag()}
        onOpenChange={(open) => !open && setPendingDeleteTag(null)}
      />
    </div>
  )
}

export default AdminCategoriesPage
