import { useMemo, useState } from 'react'
import { ChevronRight, LayoutGrid, List, Pencil, Plus, Search, Tag as TagIcon, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import CategoryFormDialog, { type CategoryFormValues } from '@/components/admin/CategoryFormDialog'
import DeleteCategoryDialog from '@/components/admin/DeleteCategoryDialog'
import DeleteTagDialog from '@/components/admin/DeleteTagDialog'
import TagFormDialog, { type TagFormValues } from '@/components/admin/TagFormDialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAdminCategories, type AdminCategory } from '@/hooks/useAdminCategories'
import { useAdminTags, type AdminTag } from '@/hooks/useAdminTags'
import { useCurrentLang } from '@/hooks/useCurrentLang'
import { useDeleteCategory } from '@/hooks/useDeleteCategory'
import { useDeleteTag } from '@/hooks/useDeleteTag'
import { useSaveCategory } from '@/hooks/useSaveCategory'
import { useSaveTag } from '@/hooks/useSaveTag'
import { getCategoryDescription } from '@/lib/categoryDescriptions'
import { getCategoryIcon } from '@/lib/categoryIcons'
import { pickLocalized } from '@/lib/localizedField'
import { getTagColors, getTagIcon } from '@/lib/tagIcons'
import { cn } from '@/lib/utils'

const inputClass =
  'rounded-control border border-border bg-surface-elevated px-2.5 py-1.5 text-sm text-foreground placeholder:text-muted-foreground'

type TabValue = 'categories' | 'tags'
type ViewMode = 'grid' | 'list'

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

function AdminCategoriesPage() {
  const { t } = useTranslation()
  const lang = useCurrentLang()

  const [activeTab, setActiveTab] = useState<TabValue>('categories')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')

  const { categories, isLoading: categoriesLoading, error: categoriesLoadError, refetch: refetchCategories } =
    useAdminCategories()
  const { saveCategory, isSaving: isSavingCategory, error: saveCategoryError } = useSaveCategory()
  const { deleteCategory, isDeleting: isDeletingCategory, error: deleteCategoryError } = useDeleteCategory()

  const { tags, isLoading: tagsLoading, error: tagsLoadError, refetch: refetchTags } = useAdminTags()
  const { saveTag, isSaving: isSavingTag, error: saveTagError } = useSaveTag()
  const { deleteTag, isDeleting: isDeletingTag, error: deleteTagError } = useDeleteTag()

  const [editingCategory, setEditingCategory] = useState<AdminCategory | null | undefined>(undefined)
  const [pendingDeleteCategory, setPendingDeleteCategory] = useState<AdminCategory | null>(null)
  const [categorySearch, setCategorySearch] = useState('')

  const [editingTag, setEditingTag] = useState<AdminTag | null | undefined>(undefined)
  const [pendingDeleteTag, setPendingDeleteTag] = useState<AdminTag | null>(null)
  const [tagSearch, setTagSearch] = useState('')

  const totalCategoryRecipes = useMemo(() => categories.reduce((sum, c) => sum + c.recipeCount, 0), [categories])

  const visibleCategories = useMemo(() => {
    const query = categorySearch.trim().toLowerCase()
    if (!query) return categories
    return categories.filter(
      (category) =>
        category.name_en.toLowerCase().includes(query) ||
        (category.name_sr?.toLowerCase().includes(query) ?? false) ||
        category.slug.toLowerCase().includes(query),
    )
  }, [categories, categorySearch])

  const visibleTags = useMemo(() => {
    const query = tagSearch.trim().toLowerCase()
    if (!query) return tags
    return tags.filter(
      (tag) =>
        tag.name_en.toLowerCase().includes(query) ||
        (tag.name_sr?.toLowerCase().includes(query) ?? false) ||
        tag.slug.toLowerCase().includes(query),
    )
  }, [tags, tagSearch])

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
      <div>
        <h1 className="text-xl font-semibold">{t('admin.categories.pageTitle')}</h1>
        <p className="text-sm text-muted-foreground">{t('admin.categories.pageSubtitle')}</p>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as TabValue)}
      >
        <TabsList>
          <TabsTrigger value="categories">{t('admin.categories.categoriesTab')}</TabsTrigger>
          <TabsTrigger value="tags">{t('admin.categories.tagsTab')}</TabsTrigger>
        </TabsList>

        <TabsContent value="categories" className="flex flex-col gap-4">
          {categoriesLoadError && <p className="text-sm text-favorite">{categoriesLoadError}</p>}

          <div className="rounded-card border border-border bg-surface">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4">
              <div className="flex items-center gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-accent-soft text-accent">
                  <LayoutGrid className="size-5" />
                </span>
                <div>
                  <h2 className="text-base font-semibold text-foreground">{t('admin.categories.categoriesCardTitle')}</h2>
                  <p className="text-sm text-muted-foreground">
                    {t('admin.categories.categoryCount', { count: categories.length })} •{' '}
                    {t('common.recipeCount', { count: totalCategoryRecipes })}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative min-w-[200px]">
                  <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    value={categorySearch}
                    onChange={(e) => setCategorySearch(e.target.value)}
                    placeholder={t('admin.categories.searchCategoriesPlaceholder')}
                    className={`${inputClass} w-full pl-8`}
                  />
                </div>
                <ViewModeToggle value={viewMode} onChange={setViewMode} />
                <button
                  type="button"
                  onClick={() => setEditingCategory(null)}
                  className="flex items-center gap-1.5 rounded-control bg-accent px-3 py-2 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent-hover"
                >
                  <Plus className="size-4" />
                  {t('admin.categories.addCategory')}
                </button>
              </div>
            </div>

            {categories.length > 0 && viewMode === 'list' && (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-border text-xs text-muted-foreground uppercase">
                      <th className="px-4 py-3 font-medium">{t('admin.categories.columnCategory')}</th>
                      <th className="px-4 py-3 font-medium">{t('admin.categories.columnSlug')}</th>
                      <th className="px-4 py-3 font-medium">{t('admin.categories.columnRecipes')}</th>
                      <th className="px-4 py-3 text-right font-medium">{t('admin.categories.columnActions')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {visibleCategories.map((category) => {
                      const Icon = getCategoryIcon(category.slug)
                      return (
                        <tr key={category.id} className="transition-colors hover:bg-surface-hover">
                          <td className="px-4 py-3">
                            <button
                              type="button"
                              onClick={() => setEditingCategory(category)}
                              className="flex items-center gap-2.5 text-left transition-colors hover:text-accent"
                            >
                              <span className="flex size-8 shrink-0 items-center justify-center rounded-control bg-accent-soft">
                                <Icon className="size-4 text-accent" />
                              </span>
                              <span className="font-medium text-foreground">
                                {pickLocalized(category.name_en, category.name_sr, lang)}
                              </span>
                            </button>
                          </td>
                          <td className="px-4 py-3">
                            <span className="rounded-pill bg-surface-elevated px-2.5 py-1 text-xs text-muted-foreground">
                              {category.slug}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="rounded-pill bg-surface-elevated px-2.5 py-1 text-xs font-medium text-foreground">
                              {category.recipeCount}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => setEditingCategory(category)}
                                aria-label={t('admin.categories.edit')}
                                className="flex size-8 items-center justify-center rounded-control border border-border text-muted-foreground hover:bg-surface-elevated hover:text-foreground"
                              >
                                <Pencil className="size-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setPendingDeleteCategory(category)}
                                aria-label={t('admin.categories.delete')}
                                className="flex size-8 items-center justify-center rounded-control border border-border text-favorite hover:bg-favorite/10"
                              >
                                <Trash2 className="size-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>

                {visibleCategories.length === 0 && (
                  <p className="px-4 py-6 text-center text-sm text-muted-foreground">{t('admin.categories.noResults')}</p>
                )}
              </div>
            )}

            {categories.length > 0 && viewMode === 'grid' && (
              <div className="p-4">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                  {visibleCategories.map((category) => {
                    const Icon = getCategoryIcon(category.slug)
                    const description = getCategoryDescription(category.slug, lang)
                    return (
                      <div
                        key={category.id}
                        className="flex flex-col gap-3 rounded-card border border-border bg-surface-elevated p-4 transition-colors hover:border-accent/50"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-3">
                            <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
                              <Icon className="size-6" />
                            </div>
                            <div className="flex flex-col items-start gap-1.5">
                              <p className="text-sm font-semibold text-foreground">
                                {pickLocalized(category.name_en, category.name_sr, lang)}
                              </p>
                              <span className="rounded-pill bg-surface px-2 py-0.5 text-xs text-muted-foreground">
                                {category.slug}
                              </span>
                              <span className="rounded-pill bg-surface px-2 py-0.5 text-xs font-medium text-foreground">
                                {t('common.recipeCount', { count: category.recipeCount })}
                              </span>
                            </div>
                          </div>
                          <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                        </div>

                        {description && <p className="text-xs text-muted-foreground">{description}</p>}

                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => setEditingCategory(category)}
                            aria-label={t('admin.categories.edit')}
                            className="flex size-8 items-center justify-center rounded-control border border-border text-muted-foreground hover:bg-surface hover:text-foreground"
                          >
                            <Pencil className="size-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setPendingDeleteCategory(category)}
                            aria-label={t('admin.categories.delete')}
                            className="flex size-8 items-center justify-center rounded-control border border-border text-favorite hover:bg-favorite/10"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {visibleCategories.length === 0 && (
                  <p className="px-4 py-6 text-center text-sm text-muted-foreground">{t('admin.categories.noResults')}</p>
                )}
              </div>
            )}

            {!categoriesLoading && categories.length === 0 && (
              <p className="px-4 py-6 text-center text-sm text-muted-foreground">
                {t('admin.categories.emptyCategoriesTitle')}
              </p>
            )}

            {!categoriesLoading && categories.length > 0 && (
              <div className="border-t border-border px-4 py-3 text-sm text-muted-foreground">
                {t('admin.categories.categoriesTotal', { count: visibleCategories.length })}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="tags" className="flex flex-col gap-4">
          {tagsLoadError && <p className="text-sm text-favorite">{tagsLoadError}</p>}

          <div className="rounded-card border border-border bg-surface">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4">
              <div className="flex items-center gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-accent-soft text-accent">
                  <TagIcon className="size-5" />
                </span>
                <div>
                  <h2 className="text-base font-semibold text-foreground">{t('admin.categories.tagsCardTitle')}</h2>
                  <p className="text-sm text-muted-foreground">{t('admin.categories.tagsCardDescription')}</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative min-w-[200px]">
                  <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    value={tagSearch}
                    onChange={(e) => setTagSearch(e.target.value)}
                    placeholder={t('admin.categories.searchTagsPlaceholder')}
                    className={`${inputClass} w-full pl-8`}
                  />
                </div>
                <ViewModeToggle value={viewMode} onChange={setViewMode} />
                <button
                  type="button"
                  onClick={() => setEditingTag(null)}
                  className="flex items-center gap-1.5 rounded-control bg-accent px-3 py-2 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent-hover"
                >
                  <Plus className="size-4" />
                  {t('admin.categories.addTag')}
                </button>
              </div>
            </div>

            {tags.length > 0 && viewMode === 'list' && (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-border text-xs text-muted-foreground uppercase">
                      <th className="px-4 py-3 font-medium">{t('admin.categories.columnTag')}</th>
                      <th className="px-4 py-3 font-medium">{t('admin.categories.columnSlug')}</th>
                      <th className="px-4 py-3 font-medium">{t('admin.categories.columnRecipes')}</th>
                      <th className="px-4 py-3 text-right font-medium">{t('admin.categories.columnActions')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {visibleTags.map((tag) => {
                      const Icon = getTagIcon(tag.slug)
                      const color = getTagColors(tag.slug)
                      return (
                        <tr key={tag.id} className="transition-colors hover:bg-surface-hover">
                          <td className="px-4 py-3">
                            <button
                              type="button"
                              onClick={() => setEditingTag(tag)}
                              className="flex items-center gap-2.5 text-left transition-colors hover:text-accent"
                            >
                              <span className={`flex size-8 shrink-0 items-center justify-center rounded-control ${color.bgSoft}`}>
                                <Icon className={`size-4 ${color.text}`} />
                              </span>
                              <span className="font-medium text-foreground">
                                {pickLocalized(tag.name_en, tag.name_sr, lang)}
                              </span>
                            </button>
                          </td>
                          <td className="px-4 py-3">
                            <span className="rounded-pill bg-surface-elevated px-2.5 py-1 text-xs text-muted-foreground">
                              {tag.slug}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="rounded-pill bg-surface-elevated px-2.5 py-1 text-xs font-medium text-foreground">
                              {tag.recipeCount}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => setEditingTag(tag)}
                                aria-label={t('admin.categories.edit')}
                                className="flex size-8 items-center justify-center rounded-control border border-border text-muted-foreground hover:bg-surface-elevated hover:text-foreground"
                              >
                                <Pencil className="size-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setPendingDeleteTag(tag)}
                                aria-label={t('admin.categories.delete')}
                                className="flex size-8 items-center justify-center rounded-control border border-border text-favorite hover:bg-favorite/10"
                              >
                                <Trash2 className="size-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>

                {visibleTags.length === 0 && (
                  <p className="px-4 py-6 text-center text-sm text-muted-foreground">{t('admin.categories.noResults')}</p>
                )}
              </div>
            )}

            {tags.length > 0 && viewMode === 'grid' && (
              <div className="p-4">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {visibleTags.map((tag) => {
                    const Icon = getTagIcon(tag.slug)
                    const color = getTagColors(tag.slug)
                    return (
                      <div
                        key={tag.id}
                        className="flex flex-col items-center gap-2 rounded-card border border-border bg-surface-elevated p-4 text-center transition-colors hover:border-accent/50"
                      >
                        <div className={cn('flex size-14 items-center justify-center rounded-full', color.bgSoft)}>
                          <Icon className={cn('size-7', color.text)} />
                        </div>
                        <p className="line-clamp-2 text-sm font-semibold text-foreground">
                          {pickLocalized(tag.name_en, tag.name_sr, lang)}
                        </p>
                        <span className="rounded-pill bg-surface px-2.5 py-1 text-xs text-muted-foreground">{tag.slug}</span>
                        <span className="rounded-pill bg-surface px-2.5 py-1 text-xs font-medium text-foreground">
                          {t('common.recipeCount', { count: tag.recipeCount })}
                        </span>
                        <div className="mt-1 flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setEditingTag(tag)}
                            aria-label={t('admin.categories.edit')}
                            className="flex size-8 items-center justify-center rounded-control border border-border text-muted-foreground hover:bg-surface hover:text-foreground"
                          >
                            <Pencil className="size-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setPendingDeleteTag(tag)}
                            aria-label={t('admin.categories.delete')}
                            className="flex size-8 items-center justify-center rounded-control border border-border text-favorite hover:bg-favorite/10"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {visibleTags.length === 0 && (
                  <p className="px-4 py-6 text-center text-sm text-muted-foreground">{t('admin.categories.noResults')}</p>
                )}
              </div>
            )}

            {!tagsLoading && tags.length === 0 && (
              <p className="px-4 py-6 text-center text-sm text-muted-foreground">{t('admin.categories.emptyTagsTitle')}</p>
            )}

            {!tagsLoading && tags.length > 0 && (
              <div className="border-t border-border px-4 py-3 text-sm text-muted-foreground">
                {t('admin.categories.tagsTotal', { count: visibleTags.length })}
              </div>
            )}
          </div>
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
