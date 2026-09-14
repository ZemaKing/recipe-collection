import { useMemo, useState } from 'react'
import {
  ChevronDown,
  LayoutGrid,
  MoreVertical,
  Pencil,
  Plus,
  Search,
  Tag as TagIcon,
  Trash2,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import CategoryFormDialog, { type CategoryFormValues } from '@/components/admin/CategoryFormDialog'
import DeleteCategoryDialog from '@/components/admin/DeleteCategoryDialog'
import DeleteSubcategoryDialog from '@/components/admin/DeleteSubcategoryDialog'
import DeleteTagDialog from '@/components/admin/DeleteTagDialog'
import SubcategoryFormDialog, { type SubcategoryFormValues } from '@/components/admin/SubcategoryFormDialog'
import TagFormDialog, { type TagFormValues } from '@/components/admin/TagFormDialog'
import ViewModeToggle, { type ViewMode } from '@/components/admin/ViewModeToggle'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAdminCategories, type AdminCategory } from '@/hooks/useAdminCategories'
import { useAdminSubcategories, type AdminSubcategory } from '@/hooks/useAdminSubcategories'
import { useAdminTags, type AdminTag } from '@/hooks/useAdminTags'
import { useCurrentLang } from '@/hooks/useCurrentLang'
import { useDeleteCategory } from '@/hooks/useDeleteCategory'
import { useDeleteSubcategory } from '@/hooks/useDeleteSubcategory'
import { useDeleteTag } from '@/hooks/useDeleteTag'
import { useSaveCategory } from '@/hooks/useSaveCategory'
import { useSaveSubcategory } from '@/hooks/useSaveSubcategory'
import { useSaveTag } from '@/hooks/useSaveTag'
import { getCategoryBadgeColor } from '@/lib/categoryColor'
import { getCategoryDescription } from '@/lib/categoryDescriptions'
import { getCategoryIcon } from '@/lib/categoryIcons'
import { textMatchesQuery } from '@/lib/diacritics'
import { pickLocalized } from '@/lib/localizedField'
import { getTagColors, getTagIcon } from '@/lib/tagIcons'
import { cn } from '@/lib/utils'

const inputClass =
  'rounded-control border border-border bg-surface-elevated px-2.5 py-1.5 text-sm text-foreground placeholder:text-muted-foreground'

type TabValue = 'categories' | 'subcategories' | 'tags'

function AdminCategoriesPage() {
  const { t } = useTranslation()
  const lang = useCurrentLang()

  const [activeTab, setActiveTab] = useState<TabValue>('categories')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')

  const { categories, isLoading: categoriesLoading, error: categoriesLoadError, refetch: refetchCategories } =
    useAdminCategories()
  const { saveCategory, isSaving: isSavingCategory, error: saveCategoryError } = useSaveCategory()
  const { deleteCategory, isDeleting: isDeletingCategory, error: deleteCategoryError } = useDeleteCategory()

  const {
    subcategories,
    isLoading: subcategoriesLoading,
    error: subcategoriesLoadError,
    refetch: refetchSubcategories,
  } = useAdminSubcategories()
  const { saveSubcategory, isSaving: isSavingSubcategory, error: saveSubcategoryError } = useSaveSubcategory()
  const { deleteSubcategory, isDeleting: isDeletingSubcategory, error: deleteSubcategoryError } =
    useDeleteSubcategory()

  const { tags, isLoading: tagsLoading, error: tagsLoadError, refetch: refetchTags } = useAdminTags()
  const { saveTag, isSaving: isSavingTag, error: saveTagError } = useSaveTag()
  const { deleteTag, isDeleting: isDeletingTag, error: deleteTagError } = useDeleteTag()

  const [editingCategory, setEditingCategory] = useState<AdminCategory | null | undefined>(undefined)
  const [pendingDeleteCategory, setPendingDeleteCategory] = useState<AdminCategory | null>(null)
  const [categorySearch, setCategorySearch] = useState('')

  const [editingSubcategory, setEditingSubcategory] = useState<AdminSubcategory | null | undefined>(undefined)
  const [pendingDeleteSubcategory, setPendingDeleteSubcategory] = useState<AdminSubcategory | null>(null)
  const [subcategorySearch, setSubcategorySearch] = useState('')
  const [collapsedCategoryIds, setCollapsedCategoryIds] = useState<Set<string>>(new Set())

  function toggleCategoryCollapse(categoryId: string) {
    setCollapsedCategoryIds((prev) => {
      const next = new Set(prev)
      if (next.has(categoryId)) next.delete(categoryId)
      else next.add(categoryId)
      return next
    })
  }

  const [editingTag, setEditingTag] = useState<AdminTag | null | undefined>(undefined)
  const [pendingDeleteTag, setPendingDeleteTag] = useState<AdminTag | null>(null)
  const [tagSearch, setTagSearch] = useState('')

  const totalCategoryRecipes = useMemo(() => categories.reduce((sum, c) => sum + c.recipeCount, 0), [categories])

  const visibleCategories = useMemo(() => {
    const query = categorySearch.trim()
    if (!query) return categories
    return categories.filter(
      (category) =>
        textMatchesQuery(category.name_en, query) ||
        (category.name_sr ? textMatchesQuery(category.name_sr, query) : false) ||
        textMatchesQuery(category.slug, query),
    )
  }, [categories, categorySearch])

  const visibleSubcategories = useMemo(() => {
    const query = subcategorySearch.trim()
    if (!query) return subcategories
    return subcategories.filter(
      (subcategory) =>
        textMatchesQuery(subcategory.name_en, query) ||
        (subcategory.name_sr ? textMatchesQuery(subcategory.name_sr, query) : false) ||
        textMatchesQuery(subcategory.slug, query) ||
        (subcategory.category ? textMatchesQuery(subcategory.category.name_en, query) : false),
    )
  }, [subcategories, subcategorySearch])

  const subcategoryGroups = useMemo(
    () =>
      categories
        .map((category) => ({
          category,
          items: visibleSubcategories.filter((subcategory) => subcategory.category_id === category.id),
        }))
        .filter((group) => group.items.length > 0),
    [categories, visibleSubcategories],
  )

  const visibleTags = useMemo(() => {
    const query = tagSearch.trim()
    if (!query) return tags
    return tags.filter(
      (tag) =>
        textMatchesQuery(tag.name_en, query) ||
        (tag.name_sr ? textMatchesQuery(tag.name_sr, query) : false) ||
        textMatchesQuery(tag.slug, query),
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

  async function handleSaveSubcategory(values: SubcategoryFormValues) {
    await saveSubcategory({ id: editingSubcategory?.id, ...values })
    setEditingSubcategory(undefined)
    refetchSubcategories()
  }

  async function handleConfirmDeleteSubcategory() {
    if (!pendingDeleteSubcategory) return
    await deleteSubcategory(pendingDeleteSubcategory.id)
    setPendingDeleteSubcategory(null)
    refetchSubcategories()
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
          <TabsTrigger value="subcategories">{t('admin.categories.subcategoriesTab')}</TabsTrigger>
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
                      <th className="px-4 py-3 font-medium">{t('admin.categories.columnRecipes')}</th>
                      <th className="px-4 py-3 text-right font-medium">{t('admin.categories.columnActions')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {visibleCategories.map((category) => {
                      const Icon = getCategoryIcon(category.slug)
                      const colors = getCategoryBadgeColor(category.slug)
                      return (
                        <tr key={category.id} className="transition-colors hover:bg-surface-hover">
                          <td className="px-4 py-3">
                            <button
                              type="button"
                              onClick={() => setEditingCategory(category)}
                              className="flex items-center gap-2.5 text-left transition-colors hover:text-accent"
                            >
                              <span className={`flex size-8 shrink-0 items-center justify-center rounded-control ${colors.bg}`}>
                                <Icon className={`size-4 ${colors.text}`} />
                              </span>
                              <span className="font-medium text-foreground">
                                {pickLocalized(category.name_en, category.name_sr, lang)}
                              </span>
                            </button>
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
                    const colors = getCategoryBadgeColor(category.slug)
                    const description = getCategoryDescription(category.slug, lang)
                    return (
                      <div
                        key={category.id}
                        className="flex flex-col gap-3 rounded-card border border-border bg-surface-elevated p-4 transition-colors hover:border-accent/50"
                      >
                        <div className="flex items-start gap-3">
                          <div className={`flex size-12 shrink-0 items-center justify-center rounded-full ${colors.bg} ${colors.text}`}>
                            <Icon className="size-6" />
                          </div>
                          <div className="flex flex-col items-start gap-1.5">
                            <p className="text-sm font-semibold text-foreground">
                              {pickLocalized(category.name_en, category.name_sr, lang)}
                            </p>
                            <span className="rounded-pill bg-surface px-2 py-0.5 text-xs font-medium text-foreground">
                              {t('common.recipeCount', { count: category.recipeCount })}
                            </span>
                          </div>
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

        <TabsContent value="subcategories" className="flex flex-col gap-4">
          {subcategoriesLoadError && <p className="text-sm text-favorite">{subcategoriesLoadError}</p>}

          <div className="rounded-card border border-border bg-surface">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4">
              <div className="flex items-center gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-accent-soft text-accent">
                  <LayoutGrid className="size-5" />
                </span>
                <div>
                  <h2 className="text-base font-semibold text-foreground">{t('admin.subcategories.cardTitle')}</h2>
                  <p className="text-sm text-muted-foreground">
                    {t('admin.subcategories.subcategoryCount', { count: subcategories.length })}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative min-w-[200px]">
                  <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    value={subcategorySearch}
                    onChange={(e) => setSubcategorySearch(e.target.value)}
                    placeholder={t('admin.subcategories.searchPlaceholder')}
                    className={`${inputClass} w-full pl-8`}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setEditingSubcategory(null)}
                  className="flex items-center gap-1.5 rounded-control bg-accent px-3 py-2 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent-hover"
                >
                  <Plus className="size-4" />
                  {t('admin.subcategories.add')}
                </button>
              </div>
            </div>

            {subcategoryGroups.length > 0 && (
              <div className="p-4">
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  {subcategoryGroups.map(({ category, items }) => {
                    const Icon = getCategoryIcon(category.slug)
                    const isCollapsed = collapsedCategoryIds.has(category.id)
                    return (
                      <div
                        key={category.id}
                        className="overflow-hidden rounded-card border border-border bg-surface-elevated"
                      >
                        <div className="flex items-center justify-between gap-2 border-b border-border p-4">
                          <div className="flex min-w-0 items-center gap-3">
                            <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-accent-soft text-accent">
                              <Icon className="size-5" />
                            </span>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-foreground">
                                {pickLocalized(category.name_en, category.name_sr, lang)}
                              </p>
                            </div>
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            <span className="rounded-pill bg-surface px-2.5 py-1 text-xs font-medium text-foreground">
                              {t('admin.subcategories.subcategoryCount', { count: items.length })}
                            </span>
                            <button
                              type="button"
                              onClick={() => toggleCategoryCollapse(category.id)}
                              aria-label={isCollapsed ? t('admin.subcategories.expand') : t('admin.subcategories.collapse')}
                              className="flex size-8 shrink-0 items-center justify-center rounded-control text-muted-foreground hover:bg-surface hover:text-foreground md:hidden"
                            >
                              <ChevronDown className={cn('size-4 transition-transform', isCollapsed && '-rotate-90')} />
                            </button>
                          </div>
                        </div>

                        <div className={cn('divide-y divide-border', isCollapsed && 'hidden md:block')}>
                          {items.map((subcategory) => (
                            <div key={subcategory.id} className="flex items-center justify-between gap-3 px-4 py-3">
                              <div className="min-w-0">
                                <p className="truncate text-sm font-medium text-foreground">
                                  {pickLocalized(subcategory.name_en, subcategory.name_sr, lang)}
                                </p>
                              </div>
                              <div className="flex shrink-0 items-center gap-3">
                                <span className="text-xs text-muted-foreground">
                                  {t('common.recipeCount', { count: subcategory.recipeCount })}
                                </span>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <button
                                      type="button"
                                      aria-label={t('admin.categories.edit')}
                                      className="flex size-8 items-center justify-center rounded-control text-muted-foreground hover:bg-surface hover:text-foreground"
                                    >
                                      <MoreVertical className="size-4" />
                                    </button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onSelect={() => setEditingSubcategory(subcategory)}>
                                      <Pencil className="size-3.5" />
                                      {t('admin.categories.edit')}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onSelect={() => setPendingDeleteSubcategory(subcategory)}
                                      className="text-favorite"
                                    >
                                      <Trash2 className="size-3.5" />
                                      {t('admin.categories.delete')}
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {subcategoryGroups.length === 0 && (
              <p className="px-4 py-6 text-center text-sm text-muted-foreground">
                {subcategories.length === 0 ? t('admin.subcategories.empty') : t('admin.categories.noResults')}
              </p>
            )}

            {!subcategoriesLoading && subcategories.length > 0 && (
              <div className="border-t border-border px-4 py-3 text-sm text-muted-foreground">
                {t('admin.subcategories.total', { count: visibleSubcategories.length })}
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

      <SubcategoryFormDialog
        subcategory={editingSubcategory}
        isSaving={isSavingSubcategory}
        error={saveSubcategoryError}
        onSave={(values) => void handleSaveSubcategory(values)}
        onOpenChange={(open) => !open && setEditingSubcategory(undefined)}
      />

      <DeleteSubcategoryDialog
        subcategoryName={
          pendingDeleteSubcategory
            ? pickLocalized(pendingDeleteSubcategory.name_en, pendingDeleteSubcategory.name_sr, lang)
            : null
        }
        isDeleting={isDeletingSubcategory}
        error={deleteSubcategoryError}
        onConfirm={() => void handleConfirmDeleteSubcategory()}
        onOpenChange={(open) => !open && setPendingDeleteSubcategory(null)}
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
