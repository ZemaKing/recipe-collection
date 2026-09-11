import { useTranslation } from 'react-i18next'
import CategoryCard from '@/components/recipes/CategoryCard'
import { useCategories } from '@/hooks/useCategories'
import { getCategoryIcon } from '@/lib/categoryIcons'

function CategoriesPage() {
  const { t } = useTranslation()
  const { categories, isLoading } = useCategories()
  const totalRecipes = categories.reduce((sum, c) => sum + c.recipeCount, 0)

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold">{t('categoriesPage.title')}</h1>
        {!isLoading && (
          <p className="text-sm text-muted-foreground">
            {t('common.categoryCount', { count: categories.length })} ·{' '}
            {t('common.recipeCount', { count: totalRecipes })}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {categories.map((category) => (
          <CategoryCard
            key={category.id}
            slug={category.slug}
            name_en={category.name_en}
            name_sr={category.name_sr}
            recipeCount={category.recipeCount}
            icon={getCategoryIcon(category.slug)}
          />
        ))}
      </div>
    </div>
  )
}

export default CategoriesPage
